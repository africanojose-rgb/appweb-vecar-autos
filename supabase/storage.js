import { supabaseClient } from './config.js';

var STORAGE_BUCKET = 'vehiculos';
var IMG_MAX_WIDTH = 800;
var IMG_QUALITY = 0.7;

export async function compressImage(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          var w = img.width;
          var h = img.height;
          if (w > IMG_MAX_WIDTH) {
            h = Math.round(h * IMG_MAX_WIDTH / w);
            w = IMG_MAX_WIDTH;
          }
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', IMG_QUALITY));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataURLToBlob(dataURL) {
  var parts = dataURL.split(',');
  var mime = parts[0].match(/:(.*?);/)[1];
  var bytes = atob(parts[1]);
  var ab = new ArrayBuffer(bytes.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

export async function uploadPhoto(file, vehicleId, index) {
  var dataUrl = await compressImage(file);
  var blob = dataURLToBlob(dataUrl);
  var filePath = vehicleId + '/' + index + '.jpg';

  var result = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (result.error) throw result.error;

  var urlResult = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return { path: filePath, url: urlResult.data.publicUrl };
}

export async function deletePhoto(filePath) {
  if (!filePath) return;

  var result = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (result.error) {
    console.error('Error deleting photo:', result.error);
  }
}

export function getPhotoUrl(path) {
  if (!path) return '';
  if (path.indexOf('http') === 0) return path;
  if (path.indexOf('data:') === 0) return path;
  var result = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  return result.data.publicUrl;
}