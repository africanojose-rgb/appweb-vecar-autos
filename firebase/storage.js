var IMG_MAX_WIDTH = 800;
var IMG_QUALITY = 0.7;

async function compressImage(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement("canvas");
        var w = img.width;
        var h = img.height;
        if (w > IMG_MAX_WIDTH) {
          h = Math.round(h * IMG_MAX_WIDTH / w);
          w = IMG_MAX_WIDTH;
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", IMG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
