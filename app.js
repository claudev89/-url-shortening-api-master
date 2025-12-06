// Función para crear un bloque individual de resultado
function crearBloqueResultado(originalUrl, shortUrl) {
    // Crear el elemento div principal
    const bloque = document.createElement('div');
    bloque.className = 'resultado-bloque';
    
    // Asignar un ID único basado en timestamp
    const bloqueId = 'bloque-' + Date.now();
    bloque.id = bloqueId;
    
    // Crear el contenido del bloque
    bloque.innerHTML = `
        <div class="respuesta-n">
            <div class="bloque-original">
                <a href="${originalUrl}" target="_blank" class="url-original">
                    <strong>${originalUrl}</strong>
                </a>
            </div>
            <div class="bloque-acortado">
                <a href="${shortUrl}" target="_blank" class="url-corta">
                    ${shortUrl}
                </a>
                <button class="btn-copiar btn" onclick="copiarUrlBloque('${shortUrl}', '${bloqueId}')">
                    Copy
                </button>
            </div>
        </div>
    `;
    
    return bloque;
}

// Función para mostrar el resultado en un nuevo bloque
function mostrarResultadoEnBloque(originalUrl, shortUrl) {
    const contenedor = document.getElementById('resultados');
    
    // Crear el bloque individual
    const nuevoBloque = crearBloqueResultado(originalUrl, shortUrl);
    
    // Insertar al principio del contenedor (arriba de todo)
    contenedor.insertBefore(nuevoBloque, contenedor.firstChild);
    
    // Opcional: Limitar a 10 bloques visibles
    limitarBloquesVisibles();
}

// Función para copiar URL desde un bloque específico
function copiarUrlBloque(url, bloqueId) {
    const bloque = document.getElementById(bloqueId);
    const boton = bloque.querySelector('.btn-copiar');
    
    navigator.clipboard.writeText(url)
        .then(() => {
            // Cambiar aspecto del botón
            boton.textContent = 'Copied!';
            boton.classList.add('copiado');
            
            // Restaurar después de 2 segundos
            setTimeout(() => {
                boton.textContent = 'Copy';
                boton.classList.remove('copiado');
            }, 2000);
            
            // Efecto visual opcional en todo el bloque
            bloque.style.boxShadow = '0 0 0 2px #2acfcf';
            setTimeout(() => {
                bloque.style.boxShadow = '';
            }, 500);
        })
        .catch(err => {
            console.error('Error al copiar:', err);
            boton.textContent = 'Error!';
            boton.style.backgroundColor = '#ff6b6b';
            
            setTimeout(() => {
                boton.textContent = 'Copy';
                boton.style.backgroundColor = '';
            }, 2000);
        });
}

// Función para mostrar error en un bloque especial
function mostrarErrorEnBloque(mensaje) {
    const contenedor = document.getElementById('shortenForm');
    
    const errorBloque = document.createElement('div');
    errorBloque.className = 'resultado-bloque error-bloque';
    
    errorBloque.innerHTML = `
        <div class="error-mensaje">
            ${mensaje}
        </div>
    `;
    
    // Insertar al principio
    contenedor.appendChild(errorBloque);
    
    // Eliminar automáticamente después de 7 segundos
    setTimeout(() => {
        errorBloque.style.opacity = '0';
        errorBloque.style.transform = 'translateX(-20px)';
        errorBloque.style.transition = 'all 0.3s';
        
        setTimeout(() => {
            if (errorBloque.parentNode) {
                errorBloque.parentNode.removeChild(errorBloque);
            }
        }, 300);
    }, 7000);
}

// Función opcional para limitar bloques visibles
function limitarBloquesVisibles(maxBloques = 10) {
    const contenedor = document.getElementById('resultados');
    const bloques = contenedor.querySelectorAll('.resultado-bloque');
    
    // Si hay más bloques del máximo, eliminar los más antiguos
    if (bloques.length > maxBloques) {
        for (let i = maxBloques; i < bloques.length; i++) {
            bloques[i].style.opacity = '0';
            bloques[i].style.transform = 'translateX(-20px)';
            bloques[i].style.transition = 'all 0.3s';
            
            setTimeout(() => {
                if (bloques[i].parentNode) {
                    bloques[i].parentNode.removeChild(bloques[i]);
                }
            }, 300);
        }
    }
}

// Modificar la función manejarFormulario para usar bloques
async function manejarFormulario(event) {
    event.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value;
    const divFormulario = document.getElementById('shortenForm');
    
    if (!url.trim()) {
        mostrarErrorEnBloque('Please add a link');
        urlInput.classList.add('input-error');
        divFormulario.classList.add('form-error');
        
        // Quitar la clase cuando el usuario empiece a escribir
        const removeError = () => {
            urlInput.classList.remove('input-error');
            divFormulario.classList.remove('form-error');
            urlInput.removeEventListener('input', removeError);
        };
        urlInput.addEventListener('input', removeError);
        
        return;
    }
    
    // Cambiar estado del botón
    const boton = document.querySelector('#shortenForm button');
    const textoOriginal = boton.textContent;
    boton.textContent = 'Shorting url...';
    boton.disabled = true;
    
    try {
        const resultado = await acortarUrl(url);
        
        if (resultado.success) {
            mostrarResultadoEnBloque(resultado.original, resultado.short);
            urlInput.value = '';
        } else {
            mostrarErrorEnBloque(resultado.error);
        }
        
    } catch (error) {
        mostrarErrorEnBloque('Error inesperado: ' + error.message);
    } finally {
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
}


// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Vincular formulario
    const form = document.getElementById('shortenForm');
    if (form) {
        form.addEventListener('submit', manejarFormulario);
    }
});

// La función acortarUrl() se mantiene igual que antes
async function acortarUrl(longUrl) {
    const apiUrl = 'https://cleanuri.com/api/v1/shorten';
    const proxyUrl = 'https://corsproxy.io/?';
    
    try {
        if (!longUrl || longUrl.trim() === '') {
            throw new Error('Please add a link');
        }
        
        const urlLimpia = longUrl.trim();
        let urlParaEnviar = urlLimpia;
        
        if (!urlLimpia.startsWith('http://') && !urlLimpia.startsWith('https://')) {
            urlParaEnviar = 'https://' + urlLimpia;
        }
        
        const urlCodificada = encodeURIComponent(urlParaEnviar);
        
        const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `url=${urlCodificada}`
        });
        
        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return {
            success: true,
            original: urlParaEnviar,
            short: data.result_url
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}