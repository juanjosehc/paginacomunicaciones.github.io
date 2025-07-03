<<<<<<< HEAD
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
=======
document.addEventListener('DOMContentLoaded', () => {
            // --- CONSTANTES Y VARIABLES GLOBALES ---
            const CORRECT_PASSWORD = '3062785';
            let db;
>>>>>>> d908a478991abce4612ea5c2a31174429df1679b

        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        document.addEventListener('DOMContentLoaded', () => {
            const CORRECT_PASSWORD = '1234';
            const uploadForm = document.getElementById('upload-form');
            const personSelect = document.getElementById('person-select');
            const fileInput = document.getElementById('file-input');
            const galleriesSection = document.getElementById('galleries-section');
            const emptyMessage = document.getElementById('empty-message');
            const errorMessage = document.getElementById('error-message');

            const collectionPath = `artifacts/${appId}/public/data/evidencias-proyecto`;

            function authenticate() {
                const password = prompt("Para realizar esta acción, por favor ingresa la contraseña:");
                if (password === null) return false;
                if (password === CORRECT_PASSWORD) return true;
                errorMessage.textContent = 'Contraseña incorrecta. La acción fue denegada.';
                errorMessage.classList.remove('hidden');
                setTimeout(() => errorMessage.classList.add('hidden'), 3000);
                return false;
            }

            function fileToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            }

            async function addFile(file, person) {
                try {
                    const fileBase64 = await fileToBase64(file);
                    await addDoc(collection(db, collectionPath), {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        person: person,
                        fileData: fileBase64,
                        createdAt: new Date()
                    });
                    uploadForm.reset();
                } catch (error) {
                    console.error("Error al añadir el archivo: ", error);
                    errorMessage.textContent = 'Error al guardar el archivo.';
                    errorMessage.classList.remove('hidden');
                }
            }

            async function deleteFile(fileId) {
                try {
                    await deleteDoc(doc(db, collectionPath, fileId));
                } catch (error) {
                    console.error("Error al eliminar el archivo: ", error);
                }
            }

            function createFileCard(fileData) {
                const card = document.createElement('div');
                card.className = 'file-card';
                card.dataset.id = fileData.id;

                const previewElement = fileData.type.startsWith('image/')
                    ? `<img src="${fileData.fileData}" class="file-preview-img" alt="Vista previa de ${fileData.name}">`
                    : `<div class="file-preview-icon"><i class="fas fa-4x ${getFileIconClass(fileData.type, fileData.name)}"></i></div>`;

                card.innerHTML = `
                    <button class="delete-button" title="Eliminar archivo"><i class="fas fa-trash-alt"></i></button>
                    ${previewElement}
                    <p class="file-name" title="${fileData.name}">${fileData.name}</p>
                    <p class="file-size">${(fileData.size / 1024).toFixed(2)} KB</p>
                    <a href="${fileData.fileData}" target="_blank" class="view-button" download="${fileData.name}">Visualizar</a>
                `;

                card.querySelector('.delete-button').addEventListener('click', () => {
                    if (authenticate()) {
                        deleteFile(fileData.id);
                    }
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
                
                if (authenticate()) {
                    addFile(file, person);
                }
            });

<<<<<<< HEAD
            async function main() {
                try {
                    if (typeof __initial_auth_token !== 'undefined') {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Error de autenticación:", error);
                    errorMessage.textContent = "Fallo en la autenticación.";
                    errorMessage.classList.remove('hidden');
                }
            }

            onAuthStateChanged(auth, (user) => {
                if (user) {
                    console.log("Usuario autenticado:", user.uid);
                    onSnapshot(collection(db, collectionPath), (querySnapshot) => {
                        const files = [];
                        querySnapshot.forEach((doc) => {
                            files.push({ id: doc.id, ...doc.data() });
                        });
                        renderFiles(files);
                    }, (error) => {
                        console.error("Error en el listener de snapshot:", error);
                        errorMessage.textContent = "Error al leer de la base de datos. Verifica los permisos.";
                        errorMessage.classList.remove('hidden');
                    });
                } else {
                    console.log("Usuario no autenticado.");
                }
            });

            main();
        });
=======
            // --- INICIALIZACIÓN ---
            renderAllFiles();
        });
>>>>>>> d908a478991abce4612ea5c2a31174429df1679b
