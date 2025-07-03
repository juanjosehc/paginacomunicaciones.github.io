document.addEventListener('DOMContentLoaded', () => {
            // --- CONFIGURACIÓN DE SUPABASE ---
            const SUPABASE_URL = 'https://hzdhgjpplcpbquxgrawe.supabase.co'; 
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZGhnanBwbGNwYnF1eGdyYXdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUxNjQ1NSwiZXhwIjoyMDY3MDkyNDU1fQ.a8Za3GErBXBJy4FBYRSXA-8U7N_CgFiBqi2mvClhnG0';

            if (!SUPABASE_URL.includes('supabase.co') || !SUPABASE_ANON_KEY.startsWith('ey')) {
                 const errorMessage = document.getElementById('error-message');
                 errorMessage.textContent = "Por favor, configura tus credenciales de Supabase en el script.";
                 errorMessage.classList.remove('hidden');
                 return;
            }
            
            const { createClient } = supabase;
            const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const CORRECT_PASSWORD = '3062785';
            const uploadForm = document.getElementById('upload-form');
            const personSelect = document.getElementById('person-select');
            const fileInput = document.getElementById('file-input');
            const submitBtn = document.querySelector('.submit-button');
            const galleriesSection = document.getElementById('galleries-section');
            const emptyMessage = document.getElementById('empty-message');
            const errorMessage = document.getElementById('error-message');
            const BUCKET_NAME = 'evidencias';
            const TABLE_NAME = 'evidencias';

            function authenticate() {
                const password = prompt("Para realizar esta acción, por favor ingresa la contraseña:");
                if (password === null) return false;
                if (password === CORRECT_PASSWORD) return true;
                errorMessage.textContent = 'Contraseña incorrecta. La acción fue denegada.';
                errorMessage.classList.remove('hidden');
                setTimeout(() => errorMessage.classList.add('hidden'), 3000);
                return false;
            }

            // FIX: New function to sanitize file names
            function sanitizeFileName(fileName) {
                // Replaces spaces and special characters with underscores
                return fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
            }

            async function addFile(file, person) {
                if (!authenticate()) return;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
                
                try {
                    const sanitizedFileName = sanitizeFileName(file.name);
                    const filePath = `public/${Date.now()}-${sanitizedFileName}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from(BUCKET_NAME)
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabaseClient.storage
                        .from(BUCKET_NAME)
                        .getPublicUrl(filePath);

                    const { error: insertError } = await supabaseClient
                        .from(TABLE_NAME)
                        .insert({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            person: person,
                            download_url: urlData.publicUrl,
                            storage_path: filePath
                        });

                    if (insertError) throw insertError;

                    uploadForm.reset();

                } catch (error) {
                    console.error("Error al añadir el archivo: ", error);
                    errorMessage.textContent = 'Error al guardar el archivo.';
                    errorMessage.classList.remove('hidden');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-upload"></i> Subir Evidencia';
                }
            }

            async function deleteFile(fileId, storagePath) {
                if (!authenticate()) return;
                try {
                    const { error: storageError } = await supabaseClient.storage
                        .from(BUCKET_NAME)
                        .remove([storagePath]);
                    
                    if (storageError) throw storageError;

                    const { error: dbError } = await supabaseClient
                        .from(TABLE_NAME)
                        .delete()
                        .eq('id', fileId);

                    if (dbError) throw dbError;

                } catch (error) {
                    console.error("Error al eliminar el archivo: ", error);
                }
            }

            function createFileCard(fileData) {
                const card = document.createElement('div');
                card.className = 'file-card';
                card.dataset.id = fileData.id;

                const previewElement = fileData.type.startsWith('image/')
                    ? `<img src="${fileData.download_url}" class="file-preview-img" alt="Vista previa de ${fileData.name}">`
                    : `<div class="file-preview-icon"><i class="fas fa-4x ${getFileIconClass(fileData.type, fileData.name)}"></i></div>`;

                card.innerHTML = `
                    <button class="delete-button" title="Eliminar archivo"><i class="fas fa-trash-alt"></i></button>
                    ${previewElement}
                    <p class="file-name" title="${fileData.name}">${fileData.name}</p>
                    <p class="file-size">${(fileData.size / 1024).toFixed(2)} KB</p>
                    <a href="${fileData.download_url}" target="_blank" class="view-button" download="${fileData.name}">Visualizar</a>
                `;

                card.querySelector('.delete-button').addEventListener('click', () => {
                    deleteFile(fileData.id, fileData.storage_path);
                });

                return card;
            }

            function renderFiles(files) {
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
                addFile(file, person);
            });

            const channel = supabaseClient.channel('realtime_evidencias')
                .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, async (payload) => {
                    console.log('Cambio recibido!', payload);
                    const { data, error } = await supabaseClient.from(TABLE_NAME).select('*').order('created_at');
                    if(data) renderFiles(data);
                })
                .subscribe();

            async function initialLoad() {
                const { data, error } = await supabaseClient.from(TABLE_NAME).select('*').order('created_at');
                if (error) {
                    console.error("Error en la carga inicial:", error);
                    errorMessage.textContent = "No se pudieron cargar las evidencias.";
                    errorMessage.classList.remove('hidden');
                } else {
                    renderFiles(data);
                }
            }

            initialLoad();
        });
