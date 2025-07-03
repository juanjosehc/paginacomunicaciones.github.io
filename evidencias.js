document.addEventListener('DOMContentLoaded', () => {
            // --- CONSTANTES Y VARIABLES GLOBALES ---
            const CORRECT_PASSWORD = '1234';
            let db;

            // --- SELECTORES DEL DOM ---
            const uploadForm = document.getElementById('upload-form');
            const personSelect = document.getElementById('person-select');
            const fileInput = document.getElementById('file-input');
            const galleriesSection = document.getElementById('galleries-section');
            const emptyMessage = document.getElementById('empty-message');
            const errorMessage = document.getElementById('error-message');

            // --- MANEJO DE LA BASE DE DATOS (INDEXEDDB) ---
            function getDB() {
                return new Promise((resolve, reject) => {
                    if (db) return resolve(db);
                    const request = indexedDB.open('EvidenciasDB', 1);
                    request.onerror = () => reject('Error al abrir la base de datos');
                    request.onupgradeneeded = (event) => {
                        event.target.result.createObjectStore('evidencias', { keyPath: 'id', autoIncrement: true });
                    };
                    request.onsuccess = (event) => {
                        db = event.target.result;
                        resolve(db);
                    };
                });
            }

            // --- LÓGICA DE AUTENTICACIÓN ---
            function authenticate() {
                const password = prompt("Para realizar esta acción, por favor ingresa la contraseña:");
                if (password === null) {
                    return false; // El usuario canceló
                }
                if (password === CORRECT_PASSWORD) {
                    return true; // Contraseña correcta
                }
                // Contraseña incorrecta
                errorMessage.textContent = 'Contraseña incorrecta. La acción fue denegada.';
                errorMessage.classList.remove('hidden');
                setTimeout(() => errorMessage.classList.add('hidden'), 3000);
                return false;
            }

            // --- LÓGICA DE ARCHIVOS ---
            async function addFile(file, person) {
                try {
                    const db = await getDB();
                    const transaction = db.transaction(['evidencias'], 'readwrite');
                    const store = transaction.objectStore('evidencias');
                    const fileData = { name: file.name, type: file.type, size: file.size, person: person, file: file };
                    const request = store.add(fileData);
                    
                    request.onsuccess = () => {
                        uploadForm.reset();
                        renderAllFiles();
                    };
                    request.onerror = () => {
                        errorMessage.textContent = 'Error al guardar el archivo.';
                        errorMessage.classList.remove('hidden');
                    };
                } catch (error) {
                    console.error("Error en addFile:", error);
                }
            }

            async function deleteFile(fileId) {
                try {
                    const db = await getDB();
                    const transaction = db.transaction(['evidencias'], 'readwrite');
                    const store = transaction.objectStore('evidencias');
                    const request = store.delete(fileId);
                    request.onsuccess = () => renderAllFiles();
                } catch (error) {
                    console.error("Error en deleteFile:", error);
                }
            }

            // --- MANEJO DE LA INTERFAZ DE USUARIO (UI) ---
            function createFileCard(fileData) {
                const card = document.createElement('div');
                card.className = 'file-card';
                card.dataset.id = fileData.id;
                const fileURL = URL.createObjectURL(fileData.file);

                const previewElement = fileData.file.type.startsWith('image/')
                    ? `<img src="${fileURL}" class="file-preview-img" alt="Vista previa de ${fileData.name}">`
                    : `<div class="file-preview-icon"><i class="fas fa-4x ${getFileIconClass(fileData.file.type, fileData.name)}"></i></div>`;

                card.innerHTML = `
                    <button class="delete-button" title="Eliminar archivo"><i class="fas fa-trash-alt"></i></button>
                    ${previewElement}
                    <p class="file-name" title="${fileData.name}">${fileData.name}</p>
                    <p class="file-size">${(fileData.size / 1024).toFixed(2)} KB</p>
                    <a href="${fileURL}" target="_blank" class="view-button" download="${fileData.name}">Visualizar</a>
                `;

                card.querySelector('.delete-button').addEventListener('click', () => {
                    if (authenticate()) {
                        deleteFile(fileData.id);
                    }
                });

                return card;
            }

            async function renderAllFiles() {
                try {
                    const db = await getDB();
                    const transaction = db.transaction(['evidencias'], 'readonly');
                    const store = transaction.objectStore('evidencias');
                    const request = store.getAll();

                    request.onsuccess = () => {
                        const files = request.result;
                        document.querySelectorAll('.file-gallery').forEach(g => g.innerHTML = '');
                        if (files && files.length > 0) {
                            files.forEach(fileData => {
                                const personId = fileData.person.replace(/\s+/g, '-').toLowerCase();
                                const galleryId = `gallery-${personId}`;
                                const targetGallery = document.getElementById(galleryId);
                                if (targetGallery) {
                                    targetGallery.appendChild(createFileCard(fileData));
                                }
                            });
                        }
                        updateGalleriesVisibility(files.length);
                    };
                } catch (error) {
                    errorMessage.textContent = 'No se pudieron cargar los archivos.';
                    errorMessage.classList.remove('hidden');
                }
            }

            function updateGalleriesVisibility(fileCount) {
                document.querySelectorAll('.person-gallery-section').forEach(section => {
                    const gallery = section.querySelector('.file-gallery');
                    section.classList.toggle('hidden', gallery.children.length === 0);
                });
                
                galleriesSection.classList.toggle('hidden', fileCount === 0);
                emptyMessage.classList.toggle('hidden', fileCount > 0);
            }

            function getFileIconClass(fileType, fileName) {
                const extension = fileName.split('.').pop().toLowerCase();
                if (fileType.includes('pdf') || extension === 'pdf') return 'fa-file-pdf';
                if (fileType.includes('word') || ['doc', 'docx'].includes(extension)) return 'fa-file-word';
                if (fileType.includes('excel') || ['xls', 'xlsx'].includes(extension)) return 'fa-file-excel';
                if (fileType.includes('presentation') || ['ppt', 'pptx'].includes(extension)) return 'fa-file-powerpoint';
                if (fileType.includes('audio')) return 'fa-file-audio';
                if (fileType.includes('video')) return 'fa-file-video';
                if (fileType.includes('zip') || ['zip', 'rar', '7z'].includes(extension)) return 'fa-file-zipper';
                if (['txt', 'md'].includes(extension)) return 'fa-file-lines';
                return 'fa-file';
            }

            // --- LÓGICA PRINCIPAL Y EVENTOS ---
            uploadForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const person = personSelect.value;
                const file = fileInput.files[0];
                if (!person || !file) {
                    errorMessage.textContent = 'Por favor, selecciona una persona y un archivo.';
                    errorMessage.classList.remove('hidden');
                    return;
                }
                errorMessage.classList.add('hidden');
                
                if (authenticate()) {
                    addFile(file, person);
                }
            });

            // --- INICIALIZACIÓN ---
            renderAllFiles();
        });