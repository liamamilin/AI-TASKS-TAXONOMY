// Paste into p5.js editor. Original starship console sketch.
let sig=0,armed=false,stars=[];
function setup(){createCanvas(900,600);textFont('monospace');for(let i=0;i<90;i++)stars.push([random(width),random(height)]);}
function draw(){background(4,12,25);for(let s of stars){fill(95,195,221,130);circle(s[0],s[1],2);s[0]-=.3;if(s[0]<0)s[0]=width;}
noFill();stroke(38,180,196);strokeWeight(2);rect(30,30,840,540,18);fill(185,244,229);noStroke();textSize(17);text('VESPER / DEEP RANGE NAVIGATION',55,65);textSize(12);fill(76,219,208);text('RESONANCE ARRAY   ·   LISTENING',55,93);
// scan rings
push();translate(285,300);for(let i=0;i<6;i++){noFill();stroke(30,110+i*13,147,130);circle(0,0,70+i*48);}stroke(92,244,211);line(0,0,cos(frameCount*.015)*150,sin(frameCount*.015)*150);pop();
// signal glints
let px=285+sin(frameCount*.013)*110,py=300+cos(frameCount*.019)*80;noStroke();fill(255,197,103,180);circle(px,py,7+sin(frameCount*.1)*2);
// telemetry right panel
noFill();stroke(39,149,164);rect(535,115,295,350,10);noStroke();fill(180,231,223);text('ANOMALY / 07',555,145);text('Origin: behind the star map',555,172);text('Signal repeats every 11.8 seconds',555,196);fill(71,226,196);for(let i=0;i<40;i++){let hh=random(8,46);rect(555+i*6,360-hh,3,hh);}
fill(231,184,120);text(armed?'TRANSMISSION ARMED':'CLICK THE SIGNAL TO RESPOND',555,420);fill(159,195,191);text('The ping contains your own voice,',555,495);text('dated 19 minutes from now.',555,516);
fill(45,190,196);text('HULL 98%     OXYGEN 71%     LOCAL TIME 03:17',55,550);}
function mousePressed(){let d=dist(mouseX,mouseY,285+sin(frameCount*.013)*110,300+cos(frameCount*.019)*80);if(d<45){armed=!armed;sig++;}}
