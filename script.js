// ---------- Configurações iniciais ----------
let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos')) || [];
let oleos = JSON.parse(localStorage.getItem('oleos')) || [];
let config = JSON.parse(localStorage.getItem('config')) || {
    alertaCombustivel: 1,  // litros
    trocaOleoKm: 1000,      // km
    trocaOleoDias: 90       // dias
};

// ---------- Funções utilitárias ----------
function salvarDados() {
    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
    localStorage.setItem('oleos', JSON.stringify(oleos));
    localStorage.setItem('config', JSON.stringify(config));
}

function kmAtual() {
    if (abastecimentos.length === 0) return 0;
    return Math.max(...abastecimentos.map(a => a.km));
}

function calcularConsumo() {
    let tanqueCheio = abastecimentos.filter(a => a.tanqueCheio);
    if (tanqueCheio.length < 2) return 0;
    let totalKm = 0;
    let totalLitros = 0;
    for (let i = 1; i < tanqueCheio.length; i++) {
        let kmPercorrido = tanqueCheio[i].km - tanqueCheio[i-1].km;
        totalKm += kmPercorrido;
        totalLitros += tanqueCheio[i].litros;
    }
    return (totalKm / totalLitros).toFixed(2);
}

function autonomia() {
    if (abastecimentos.length === 0) return 0;
    let ultimo = abastecimentos[abastecimentos.length - 1];
    let consumo = calcularConsumo();
    if (consumo == 0) return 0;
    return (ultimo.litros * consumo).toFixed(1);
}

function proximaTrocaOleo() {
    if (oleos.length === 0) return {km: config.trocaOleoKm, dias: config.trocaOleoDias};
    let ultima = oleos[oleos.length - 1];
    let kmFaltando = config.trocaOleoKm - (kmAtual() - ultima.km);
    let diasPassados = Math.floor((Date.now() - new Date(ultima.data).getTime()) / (1000*60*60*24));
    let diasFaltando = config.trocaOleoDias - diasPassados;
    return {km: kmFaltando, dias: diasFaltando};
}

// ---------- Atualizar Dashboard ----------
function atualizarDashboard() {
    document.getElementById('kmAtualDisplay').innerText = kmAtual();
    document.getElementById('consumoDisplay').innerText = calcularConsumo();
    document.getElementById('autonomiaDisplay').innerText = autonomia();

    let troca = proximaTrocaOleo();
    document.getElementById('proximaOleoDisplay').innerText = `${troca.km} km / ${troca.dias} dias`;

    // Alertas
    if (autonomia() < config.alertaCombustivel) alert('⚠ Combustível baixo!');
    if (troca.km <= 0 || troca.dias <= 0) alert('⚠ Troca de óleo necessária!');
}

// ---------- Eventos ----------
document.getElementById('formAbastecimento').addEventListener('submit', e => {
    e.preventDefault();
    let km = parseInt(document.getElementById('kmAbastecimento').value);
    let litros = parseFloat(document.getElementById('litros').value);
    let valor = parseFloat(document.getElementById('valor').value);
    let tanqueCheio = document.getElementById('tanqueCheio').checked;

    abastecimentos.push({km, litros, valor, tanqueCheio, data: new Date()});
    salvarDados();
    atualizarDashboard();
    e.target.reset();
});

document.getElementById('formOleo').addEventListener('submit', e => {
    e.preventDefault();
    let km = parseInt(document.getElementById('kmOleo').value);
    oleos.push({km, data: new Date()});
    salvarDados();
    atualizarDashboard();
    e.target.reset();
});

// ---------- Gráficos ----------
function desenharGraficos() {
    const ctxC = document.getElementById('graficoConsumo').getContext('2d');
    const ctxO = document.getElementById('graficoOleo').getContext('2d');

    // Limpar
    ctxC.clearRect(0, 0, 400, 200);
    ctxO.clearRect(0, 0, 400, 200);

    // Consumo
    ctxC.strokeStyle = '#0ff';
    ctxC.beginPath();
    abastecimentos.forEach((a,i)=>{
        let x = i * 40 + 20;
        let y = 200 - (a.litros*20);
        if (i===0) ctxC.moveTo(x,y);
        else ctxC.lineTo(x,y);
    });
    ctxC.stroke();

    // Troca de óleo
    ctxO.strokeStyle = '#f00';
    ctxO.beginPath();
    oleos.forEach((o,i)=>{
        let x = i * 50 + 20;
        let y = 100;
        ctxO.moveTo(x,0);
        ctxO.lineTo(x,200);
    });
    ctxO.stroke();
}

// Atualizar interface ao carregar
atualizarDashboard();
desenharGraficos();
