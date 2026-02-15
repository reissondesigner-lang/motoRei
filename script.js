// ---------- Dados ----------
let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos')) || [];
let oleos = JSON.parse(localStorage.getItem('oleos')) || [];
let config = JSON.parse(localStorage.getItem('config')) || {
    alertaCombustivel: 1,
    trocaOleoKm: 1000,
    trocaOleoDias: 90
};

// ---------- Utilitários ----------
function salvarDados(){
    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
    localStorage.setItem('oleos', JSON.stringify(oleos));
    localStorage.setItem('config', JSON.stringify(config));
}

function kmAtual(){
    if(abastecimentos.length===0) return 0;
    return Math.max(...abastecimentos.map(a=>a.km));
}

function calcularConsumo(){
    let cheio = abastecimentos.filter(a=>a.tanqueCheio);
    if(cheio.length<2) return 0;
    let kmTotal=0, litrosTotal=0;
    for(let i=1;i<cheio.length;i++){
        kmTotal += cheio[i].km - cheio[i-1].km;
        litrosTotal += cheio[i].litros;
    }
    return (kmTotal/litrosTotal).toFixed(2);
}

function autonomia(){
    if(abastecimentos.length===0) return 0;
    let ultimo = abastecimentos[abastecimentos.length-1];
    let consumo = calcularConsumo();
    if(consumo==0) return 0;
    return (ultimo.litros*consumo).toFixed(1);
}

function proximaTrocaOleo(){
    if(oleos.length===0) return {km: config.trocaOleoKm, dias: config.trocaOleoDias};
    let ultima = oleos[oleos.length-1];
    let kmFaltando = config.trocaOleoKm - (kmAtual()-ultima.km);
    let diasPassados = Math.floor((Date.now() - new Date(ultima.data).getTime()) / (1000*60*60*24));
    let diasFaltando = config.trocaOleoDias - diasPassados;
    return {km: kmFaltando, dias: diasFaltando};
}

// ---------- Velocímetros avançados ----------
function desenharVelocimetroAvancado(canvasId, valor, maxValor, cor){
    const canvas=document.getElementById(canvasId);
    const ctx=canvas.getContext('2d');
    const cx=canvas.width/2;
    const cy=canvas.height/2;
    const radius=Math.min(cx,cy)-10;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Fundo degradê
    let grad=ctx.createRadialGradient(cx,cy,radius/2,cx,cy,radius);
    grad.addColorStop(0,'#111');
    grad.addColorStop(1,'#222');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.arc(cx,cy,radius,0,2*Math.PI);
    ctx.fill();

    // Arco base
    ctx.beginPath();
    ctx.arc(cx,cy,radius,Math.PI,0,false);
    ctx.lineWidth=20;
    ctx.strokeStyle='#333';
    ctx.stroke();

    // Arco do valor
    let ang=Math.PI + (valor/maxValor)*Math.PI;
    ctx.beginPath();
    ctx.arc(cx,cy,radius,Math.PI,ang,false);
    ctx.strokeStyle=cor;
    ctx.lineWidth=20;
    ctx.shadowBlur=10;
    ctx.shadowColor=cor;
    ctx.stroke();

    // Ponteiro
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    let px=cx+radius*Math.cos(anguloToRadians(valor,maxValor));
    let py=cy+radius*Math.sin(anguloToRadians(valor,maxValor));
    ctx.lineTo(px,py);
    ctx.lineWidth=4;
    ctx.strokeStyle=cor;
    ctx.stroke();

    // Texto
    ctx.fillStyle='#0ff';
    ctx.font='20px Arial';
    ctx.textAlign='center';
    ctx.fillText(valor.toFixed(1),cx,cy+10);
}

function anguloToRadians(valor,max){
    return Math.PI + (valor/max)*Math.PI;
}

function atualizarVelocimetros(){
    // Autonomia
    desenharVelocimetroAvancado('velocimetroAutonomia', parseFloat(autonomia()), 300, '#0ff');

    // Combustível
    let litros=abastecimentos.length===0?0:abastecimentos[abastecimentos.length-1].litros;
    desenharVelocimetroAvancado('velocimetroCombustivel', litros, 20, '#ff0');
}

// ---------- Dashboard ----------
function atualizarDashboard(){
    document.getElementById('kmAtualDisplay').innerText=kmAtual();
    document.getElementById('consumoDisplay').innerText=calcularConsumo();

    let troca=proximaTrocaOleo();
    document.getElementById('proximaOleoDisplay').innerText=`${troca.km} km / ${troca.dias} dias`;

    // Alertas
    if(autonomia()<config.alertaCombustivel) alert('⚠ Combustível baixo!');
    if(troca.km<=0 || troca.dias<=0) alert('⚠ Troca de óleo necessária!');

    // Velocímetros
    atualizarVelocimetros();
}

// ---------- Formulários ----------
document.getElementById('formAbastecimento').addEventListener('submit',e=>{
    e.preventDefault();
    let km=parseInt(document.getElementById('kmAbastecimento').value);
    let litros=parseFloat(document.getElementById('litros').value);
    let valor=parseFloat(document.getElementById('valor').value);
    let tanqueCheio=document.getElementById('tanqueCheio').checked;

    abastecimentos.push({km,litros,valor,tanqueCheio,data:new Date()});
    salvarDados();
    atualizarDashboard();
    e.target.reset();
});

document.getElementById('formOleo').addEventListener('submit',e=>{
    e.preventDefault();
    let km=parseInt(document.getElementById('kmOleo').value);
    oleos.push({km,data:new Date()});
    salvarDados();
    atualizarDashboard();
    e.target.reset();
});

// ---------- Gráficos históricos ----------
function desenharGraficos(){
    const ctxC=document.getElementById('graficoConsumo').getContext('2d');
    const ctxO=document.getElementById('graficoOleo').getContext('2d');
    ctxC.clearRect(0,0,400,200);
    ctxO.clearRect(0,0,400,200);

    // Consumo
    ctxC.strokeStyle='#0ff';
    ctxC.beginPath();
    abastecimentos.forEach((a,i)=>{
        let x=i*40+20;
        let y=200-(a.litros*20);
        if(i===0) ctxC.moveTo(x,y);
        else ctxC.lineTo(x,y);
    });
    ctxC.stroke();

    // Troca de óleo
    ctxO.strokeStyle='#f00';
    ctxO.beginPath();
    oleos.forEach((o,i)=>{
        let x=i*50+20;
        ctxO.moveTo(x,0);
        ctxO.lineTo(x,200);
    });
    ctxO.stroke();
}

// ---------- Inicialização ----------
atualizarDashboard();
desenharGraficos();
