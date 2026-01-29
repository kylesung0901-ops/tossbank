document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

    // 2. Header Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            header.classList.toggle('menu-open');
            const isOpen = header.classList.contains('menu-open');
            mobileBtn.textContent = isOpen ? '✕' : '☰';
        });

        // Close menu when clicking links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                header.classList.remove('menu-open');
                mobileBtn.textContent = '☰';
            });
        });
    }

    // 4. Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href.startsWith('#')) return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const hHeight = header.offsetHeight;
                // Extra offset for contact section to show form inputs
                const extraOffset = href === '#contact' ? 50 : 0;
                const pos = target.getBoundingClientRect().top + window.pageYOffset - hHeight - extraOffset;
                window.scrollTo({
                    top: pos,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 5. Firebase & Form Submission
    const firebaseConfig = {
        apiKey: "AIzaSyC3XN0TK1ZUenxgXPn7jbf_p6x4f-OKOQk",
        authDomain: "tossbank-39252.firebaseapp.com",
        projectId: "tossbank-39252",
        storageBucket: "tossbank-39252.firebasestorage.app",
        messagingSenderId: "210375359934",
        appId: "1:210375359934:web:6ddcddbcedd0ad659bcdef",
        measurementId: "G-56RBXGMMJ8"
    };

    // Initialize Firebase if script is loaded
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();

        const form = document.getElementById('inquiryForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('userName').value;
                const phone = document.getElementById('userPhone').value;
                const email = document.getElementById('userEmail').value;
                const type = document.getElementById('inquiryType').value;
                const message = document.getElementById('message').value;

                if (!name || !phone) {
                    alert('성함과 연락처는 필수 입력입니다.');
                    return;
                }

                const fullMsg = `[헬로큐브 문의]\n\n` +
                    `■ 성함: ${name}\n` +
                    `■ 연락처: ${phone}\n` +
                    `■ 이메일: ${email || '미입력'}\n` +
                    `■ 유형: ${type}\n` +
                    `■ 내용:\n${message || '내용 없음'}`;

                try {
                    // Save to Firestore
                    await db.collection("inquiries").add({
                        name, phone, email, type, message,
                        createdAt: new Date()
                    });

                    // Copy to clipboard
                    await navigator.clipboard.writeText(fullMsg);

                    alert("문의 내용이 복사되었습니다.\n오픈채팅창에 붙여넣어 전송해주세요!");
                    window.open("https://open.kakao.com/o/sI6lIS0h");
                    form.reset();
                } catch (err) {
                    console.error("Submission Error:", err);
                    alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                }
            });
        }
    }

    // 6. Modal Controls
    const privacyLink = document.getElementById('privacyLink');
    const privacyModal = document.getElementById('privacyModal');
    const closeBtn = document.querySelector('.close-modal');

    if (privacyLink && privacyModal) {
        privacyLink.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    const closeModal = () => {
        if (privacyModal) privacyModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === privacyModal) closeModal();
    });
});
