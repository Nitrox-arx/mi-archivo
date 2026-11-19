let temaActual = 'todas';
let etiquetaActual = '';

const nomsTemes = {
    psicologia: '🧠 Psicologia',
    filosofia: '🦉 Filosofia',
    ia: '🤖 Intel·ligència Artificial',
    art: '🎨 Art i Literatura',
    feina: '🛡️ Feina (Policia)',
    creixement: '🌱 Creixement Personal'
};

const nomsCat2 = {
    rapida: '⚡ Lectura ràpida',
    analitzar: '🔍 Per analitzar',
    indagar: '🧭 Pendent indagar'
};

const nomsFonts = {
    noticies: '🗞️ Notícies',
    articles: '📄 Articles',
    blogs: '✍️ Blogs',
    video: '🎬 Vídeo'
};

window.toggleFormulari = function() {
    const form = document.getElementById('formulari-nou');
    if (!form) return;
    form.style.display = (form.style.display === 'block') ? 'none' : 'block';
};

window.afegirRecurs = function() {
    const titol = document.getElementById('nou-titol').value.trim();
    if (!titol) {
        alert('Si us plau, escriu un títol.');
        return;
    }
    const url = document.getElementById('nou-url').value.trim();
    const tema = document.getElementById('nou-tema').value;
    const cat2 = document.getElementById('nou-cat2').value;
    const fuente = document.getElementById('nou-fuente').value;
    const etiquetesRaw = document.getElementById('nou-etiquetes').value.trim();
    const resum = document.getElementById('nou-resum').value.trim();
    const nota = document.getElementById('nou-nota').value.trim();

    const id = 'item-' + Date.now();
    const avui = new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
    const etiquetesArray = etiquetesRaw ? etiquetesRaw.split(/\s+/).map(t => t.startsWith('#') ? t : '#' + t) : [];

    const dades = { id, titol, url, tema, cat2, fuente, etiquetesArray, resum, nota, data: avui };
    const guardats = JSON.parse(localStorage.getItem('arxiu_personal_items') || '[]');
    guardats.unshift(dades);
    localStorage.setItem('arxiu_personal_items', JSON.stringify(guardats));
    if (nota) localStorage.setItem('nota_' + id, nota);

    renderitzarTargeta(dades);
    actualizarContadores();
    actualitzarBarraEtiquetes();
    aplicarFiltros();

    document.getElementById('nou-titol').value = '';
    document.getElementById('nou-url').value = '';
    document.getElementById('nou-etiquetes').value = '';
    document.getElementById('nou-resum').value = '';
    document.getElementById('nou-nota').value = '';
    window.toggleFormulari();
};

function renderitzarTargeta(d) {
    const titolHtml = d.url ? `<a href="${d.url}" target="_blank">${d.titol}</a>` : d.titol;
    const tagsHtml = (d.etiquetesArray || []).map(t => `<span class="hashtag" onclick="filtrarPerEtiqueta('${t}')">${t}</span>`).join('');
    const html = `
        <article class="entrada" id="${d.id}" data-tema="${d.tema}" data-cat2="${d.cat2}" data-fuente="${d.fuente}">
            <div class="meta">
                <span class="badge badge-tema">${nomsTemes[d.tema] || d.tema}</span>
                <span class="badge badge-cat2">${nomsCat2[d.cat2] || d.cat2}</span>
                <span class="badge badge-fuente">${nomsFonts[d.fuente] || d.fuente}</span>
                <span class="fecha">${d.data}</span>
                <button class="btn-check" onclick="toggleLeido('${d.id}')">○ Pendent</button>
            </div>
            <h2>${titolHtml}</h2>
            ${d.resum ? `<p class="resum">${d.resum}</p>` : ''}
            <div class="etiquetes-llista">${tagsHtml}</div>
            <div class="notes-box">
                <button class="notes-toggle" onclick="toggleNota('nota-${d.id}')">📝 Les meves notes</button>
                <textarea class="notes-area" id="nota-${d.id}" placeholder="Escriu aquí les teves notes o reflexions..." oninput="guardarNota('${d.id}', this.value)">${d.nota || ''}</textarea>
                <button class="btn-copiar-html" onclick="copiarCodiGitHub('${d.id}')">📋 Copiar codi per a GitHub</button>
            </div>
        </article>`;
    const lista = document.getElementById('lista-archivo');
    if (lista) lista.insertAdjacentHTML('afterbegin', html);
}

window.copiarCodiGitHub = function(id) {
    const el = document.getElementById(id).cloneNode(true);
    const btnCopiar = el.querySelector('.btn-copiar-html');
    if (btnCopiar) btnCopiar.remove();
    navigator.clipboard.writeText(el.outerHTML).then(() => {
        alert('Codi copiat! Enganxa’l dins de <main id="lista-archivo"> al teu index.html de GitHub.');
    });
};

window.toggleLeido = function(id) {
    const entrada = document.getElementById(id);
    if (!entrada) return;
    const esLeido = !entrada.classList.contains('leido');
    marcarVisualmente(entrada, esLeido);
    localStorage.setItem('leido_' + id, esLeido);
    actualizarContadores();
    aplicarFiltros();
};

function marcarVisualmente(entrada, estado) {
    const btn = entrada.querySelector('.btn-check');
    if (!btn) return;
    if (estado) {
        entrada.classList.add('leido');
        btn.textContent = '✓ Llegit';
    } else {
        entrada.classList.remove('leido');
        btn.textContent = '○ Pendent';
    }
}

window.guardarNota = function(id, valor) {
    localStorage.setItem('nota_' + id, valor);
};

window.toggleNota = function(textareaId) {
    const el = document.getElementById(textareaId);
    if (el) el.style.display = (el.style.display === 'none') ? 'block' : 'none';
};

window.filtrarPerEtiqueta = function(tag) {
    etiquetaActual = (etiquetaActual === tag) ? '' : tag;
    actualitzarBarraEtiquetes();
    aplicarFiltros();
};

function actualizarContadores() {
    const entradas = document.querySelectorAll('.entrada');
    let pendientes = 0;
    const conteoTemas = {};
    entradas.forEach(e => {
        const tema = e.getAttribute('data-tema');
        conteoTemas[tema] = (conteoTemas[tema] || 0) + 1;
        if (!e.classList.contains('leido')) pendientes++;
    });
    const cTodas = document.getElementById('count-todas');
    const cPend = document.getElementById('count-pendientes');
    if (cTodas) cTodas.textContent = entradas.length + ' items';
    if (cPend) cPend.textContent = pendientes + ' items';

    document.querySelectorAll('.carpeta-card').forEach(card => {
        const t = card.getAttribute('data-tema');
        if (t !== 'todas' && t !== 'pendientes') {
            const span = document.getElementById('count-' + t);
            if (span) span.textContent = (conteoTemas[t] || 0) + ' items';
        }
    });
}

function actualitzarBarraEtiquetes() {
    const barra = document.getElementById('barra-etiquetes');
    if (!barra) return;
    const tagsSet = new Set();
    document.querySelectorAll('.entrada').forEach(entrada => {
        const temaEntrada = entrada.getAttribute('data-tema');
        const esLeido = entrada.classList.contains('leido');
        if (temaActual === 'todas' || (temaActual === 'pendientes' && !esLeido) || temaEntrada === temaActual) {
            entrada.querySelectorAll('.hashtag').forEach(h => tagsSet.add(h.textContent.trim()));
        }
    });
    if (tagsSet.size === 0) {
        barra.innerHTML = '';
        return;
    }
    let html = '<span style="font-size:0.78rem; color:var(--muted); font-weight:700;">Etiquetes:</span>';
    tagsSet.forEach(tag => {
        html += `<span class="tag-chip ${etiquetaActual === tag ? 'activa' : ''}" onclick="filtrarPerEtiqueta('${tag}')">${tag}</span>`;
    });
    barra.innerHTML = html;
}

function aplicarFiltros() {
    const buscador = document.getElementById('buscador');
    const filtroCat2 = document.getElementById('filtro-cat2');
    const filtroFuente = document.getElementById('filtro-fuente');
    const texto = buscador ? buscador.value.toLowerCase() : '';
    const cat2 = filtroCat2 ? filtroCat2.value : 'todas';
    const fuente = filtroFuente ? filtroFuente.value : 'todas';

    document.querySelectorAll('.entrada').forEach(entrada => {
        const temaEntrada = entrada.getAttribute('data-tema');
        const cat2Entrada = entrada.getAttribute('data-cat2');
        const fuenteEntrada = entrada.getAttribute('data-fuente');
        const esLeido = entrada.classList.contains('leido');
        const contenido = entrada.textContent.toLowerCase();

        const coincideTema = (temaActual === 'todas') || (temaActual === 'pendientes' && !esLeido) || (temaEntrada === temaActual);
        const coincideCat2 = (cat2 === 'todas') || (cat2Entrada === cat2);
        const coincideFuente = (fuente === 'todas') || (fuenteEntrada === fuente);
        const coincideTexto = contenido.includes(texto);
        const coincideTag = !etiquetaActual || contenido.includes(etiquetaActual.toLowerCase());

        entrada.style.display = (coincideTema && coincideCat2 && coincideFuente && coincideTexto && coincideTag) ? 'block' : 'none';
    });
}

function iniciarApp() {
    const guardats = JSON.parse(localStorage.getItem('arxiu_personal_items') || '[]');
    guardats.slice().reverse().forEach(dades => renderitzarTargeta(dades));

    document.querySelectorAll('.entrada').forEach(entrada => {
        const id = entrada.id;
        if (localStorage.getItem('leido_' + id) === 'true') marcarVisualmente(entrada, true);
        const notaGuardada = localStorage.getItem('nota_' + id);
        const textarea = document.getElementById('nota-' + id);
        if (notaGuardada !== null && textarea) textarea.value = notaGuardada;
    });

    document.querySelectorAll('.carpeta-card').forEach(carpeta => {
        carpeta.addEventListener('click', () => {
            document.querySelectorAll('.carpeta-card').forEach(c => c.classList.remove('activa'));
            carpeta.classList.add('activa');
            temaActual = carpeta.getAttribute('data-tema');
            etiquetaActual = '';
            actualitzarBarraEtiquetes();
            aplicarFiltros();
        });
    });

    const buscador = document.getElementById('buscador');
    const filtroCat2 = document.getElementById('filtro-cat2');
    const filtroFuente = document.getElementById('filtro-fuente');
