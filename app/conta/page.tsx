"use client";
import {useState} from "react";
export default function Conta(){
 const [mode,setMode]=useState<"cadastro"|"login">("cadastro");
 const [sent,setSent]=useState(false);
 return <main className="account-page">
  <header className="site-header forum-nav"><a className="brand" href="/"><span className="brand-mark">RF</span><span className="brand-copy"><strong>ASCENSION</strong><small>PRIVATE SERVER</small></span></a><nav><a href="/">Início</a><a href="/#download">Download</a><a href="/forum">Fórum</a><a className="active" href="/conta">Minha conta</a></nav><div className="header-tools"><span className="lang-switch"><b>PT</b><a href="/en/account">EN</a></span><a className="header-cta" href="/">← Voltar</a></div></header>
  <section className="account-shell">
   <div className="account-story"><span className="kicker">PORTAL DO JOGADOR</span><h1>Sua jornada<br/><em>começa aqui.</em></h1><p>Crie sua identidade no RF Ascension, escolha sua raça dentro do jogo e escreva seu nome na história de Novus.</p><div className="account-perks"><span><b>01</b> Cadastro rápido</span><span><b>02</b> Conta protegida</span><span><b>03</b> Acesso ao fórum</span></div><div className="account-orbit"><i/><i/><i/></div>
   </div>
   <div className="account-panel">
    <div className="account-tabs"><button className={mode==="cadastro"?"active":""} onClick={()=>{setMode("cadastro");setSent(false)}}>Criar conta</button><button className={mode==="login"?"active":""} onClick={()=>{setMode("login");setSent(false)}}>Entrar</button></div>
    {sent?<div className="account-success"><span>✓</span><h2>{mode==="cadastro"?"Cadastro demonstrado!":"Login demonstrado!"}</h2><p>A integração com o banco de contas será conectada na próxima etapa.</p><button className="btn btn-primary" onClick={()=>setSent(false)}>Voltar ao formulário</button></div>:
    <form onSubmit={e=>{e.preventDefault();setSent(true)}}>
     <span className="mini-label">{mode==="cadastro"?"NOVA IDENTIDADE":"BEM-VINDO DE VOLTA"}</span><h2>{mode==="cadastro"?"Crie sua conta":"Acesse o painel"}</h2><p>{mode==="cadastro"?"Use dados válidos para recuperar sua conta no futuro.":"Entre para gerenciar sua conta e seus créditos."}</p>
     <label>Usuário<input name="username" required minLength={4} placeholder="Seu nome de usuário" autoComplete="username"/></label>
     {mode==="cadastro"&&<label>E-mail<input name="email" required type="email" placeholder="voce@email.com" autoComplete="email"/></label>}
     <div className="field-row"><label>Senha<input name="password" required type="password" minLength={6} placeholder="••••••••" autoComplete={mode==="cadastro"?"new-password":"current-password"}/></label>{mode==="cadastro"&&<label>Confirmar senha<input name="confirm" required type="password" minLength={6} placeholder="••••••••" autoComplete="new-password"/></label>}</div>
     {mode==="cadastro"?<label className="check"><input type="checkbox" required/><span>Li e aceito os <a href="/forum#informacoes">termos e regras do servidor</a>.</span></label>:<a className="forgot" href="/conta/recuperar">Esqueci minha senha</a>}
     <button className="btn btn-primary account-submit" type="submit">{mode==="cadastro"?"Criar minha conta":"Entrar no painel"} <span>↗</span></button>
     <small className="form-note">⌾ Seus dados serão protegidos e nunca compartilhados.</small>
    </form>}
   </div>
  </section>
 </main>
}
