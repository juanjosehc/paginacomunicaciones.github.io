// --- SCRIPT PARA ANIMACIONES Y NAVBAR ---
        document.addEventListener('DOMContentLoaded', () => {
            const navbar = document.getElementById('navbar');
            const faders = document.querySelectorAll('.fade-in');

            // Cambiar estilo de la navbar al hacer scroll
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            });

            // Animación de fade-in para elementos
            const appearOptions = {
                threshold: 0.2,
                rootMargin: "0px 0px -50px 0px"
            };

            const appearOnScroll = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) {
                        return;
                    } else {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, appearOptions);

            faders.forEach(fader => {
                appearOnScroll.observe(fader);
            });
        });