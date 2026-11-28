#!/usr/bin/env python3
"""Create an original 8-second sound postcard; Python standard library only."""
import math, random, wave, struct, json
RATE=22050; N=RATE*8; rng=random.Random(42); samples=[0.0]*N
def add(start,end,fn,fade=.02):
 a=int(start*RATE); b=int(end*RATE); length=b-a
 for i in range(length):
  t=i/RATE; env=min(1,i/(fade*RATE),(length-1-i)/(fade*RATE)); samples[a+i]+=fn(t)*max(0,env)
def bell(t): return .22*math.sin(2*math.pi*880*t)*math.exp(-4*t)+.14*math.sin(2*math.pi*1320*t)*math.exp(-5*t)
add(.5,.9,bell);add(.95,1.3,lambda t:.78*bell(t))
for start in (2,2.5,3,3.5):
 add(start,start+.2,lambda t: .34*(math.sin(2*math.pi*76*t)+.5*math.sin(2*math.pi*44*t))*math.exp(-18*t))
add(5,7,lambda t:.12*(rng.random()*2-1)*(.35+.65*abs(math.sin(2*math.pi*2.8*t))))
peak=max(abs(x) for x in samples); scale=min(1,.79/peak)
pcm=[max(-32768,min(32767,round(x*scale*32767))) for x in samples]
with wave.open('postcard.wav','wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(struct.pack('<%dh'%N,*pcm))
