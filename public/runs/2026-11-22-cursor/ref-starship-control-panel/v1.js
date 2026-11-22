let alarm = false;
let warp = 0;
let heading = 18;
function setup() {
  createCanvas(windowWidth, min(windowHeight, 640));
  textFont("monospace");
}
function windowResized() {
  resizeCanvas(windowWidth, min(windowHeight, 640));
}
function draw() {
  background(7, 12, 18);
  heading += 0.15;
  const sweep = (frameCount * 0.04) % TWO_PI;
  noStroke();
  fill(14, 28, 34);
  rect(24, 24, width * 0.42, height - 48, 8);
  fill(186, 232, 214);
  textSize(14);
  text("航迹 " + nf(heading % 360, 1, 1), 40, 52);
  text("曲速 " + warp.toFixed(1), 40, 76);
  text(alarm ? "警报 开" : "警报 关", 40, 100);
  push();
  translate(width * 0.22, height * 0.58);
  noFill();
  stroke(80, 180, 160);
  circle(0, 0, 150);
  line(0, 0, cos(sweep) * 70, sin(sweep) * 70);
  pop();
  drawButton(width * 0.55, 80, "警报");
  drawButton(width * 0.55, 160, "曲速");
  stroke(240, 190, 90);
  strokeWeight(4);
  const needle = -HALF_PI + (warp / 4) * PI;
  const gx = width * 0.78, gy = height * 0.62;
  line(gx, gy, gx + cos(needle) * 50, gy + sin(needle) * 50);
  noStroke();
  fill(alarm ? color(220, 70, 60) : color(40, 70, 64));
  circle(width * 0.78, 110, 28);
}
function drawButton(x, y, label) {
  const hot = alarm && label === "警报";
  fill(hot ? 150 : 24, hot ? 40 : 40, hot ? 36 : 48);
  stroke(232, 214, 180);
  rect(x, y, 120, 48, 6);
  noStroke();
  fill(244, 236, 220);
  text(label, x + 28, y + 30);
}
function mousePressed() {
  if (inside(width * 0.55, 80)) alarm = !alarm;
  if (inside(width * 0.55, 160)) warp = (warp + 0.5) % 4.5;
}
function inside(x, y) {
  return mouseX >= x && mouseX <= x + 120 && mouseY >= y && mouseY <= y + 48;
}
