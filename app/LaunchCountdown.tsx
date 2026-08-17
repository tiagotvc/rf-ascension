"use client";
import {useEffect,useState} from "react";
import {siteConfig} from "./config/site";
const target=new Date(siteConfig.launchAt).getTime();
export default function LaunchCountdown(){const [left,setLeft]=useState<number|null>(null);useEffect(()=>{const tick=()=>setLeft(Math.max(0,target-Date.now()));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer)},[]);const total=Math.floor((left??0)/1000);const values=[Math.floor(total/86400),Math.floor(total%86400/3600),Math.floor(total%3600/60),total%60];const labels=["DIAS","HORAS","MIN","SEG"];return <div className="launch-countdown" role="timer" aria-label="Contagem regressiva para a abertura">{values.map((value,i)=><div key={labels[i]}><strong>{left===null?"--":String(value).padStart(2,"0")}</strong><span>{labels[i]}</span></div>)}</div>}
