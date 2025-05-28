var data = [];
for (var i = 0; i < 100; i++) {
    var r = imgData.data[i * 4];
    var g = imgData.data[i * 4 + 1];
    var b = imgData.data[i * 4 + 2];

    var lum = 255 - (0.2125 * r + 0.7154 * g + 0.0721 * b);
    lum = (lum - 125) / 10 + 50;
    data.push([i % width, height - Math.floor(i / width), lum]);
}