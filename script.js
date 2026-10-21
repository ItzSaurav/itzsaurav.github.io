document.addEventListener('DOMContentLoaded', () => {
    
    // Theme Switcher (Light/Dark Mode)
    const toggleSwitch = document.getElementById('checkbox');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'light') toggleSwitch.checked = true;
    }

    toggleSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }    
    });

    // Typing Effect - honest titles
    const texts = [
        "Student & Developer.",
        "Python & JavaScript Learner.",
        "Automation Enthusiast.",
        "Building side projects."
    ];
    let count = 0;
    let index = 0;
    let currentText = "";
    let letter = "";
    let isDeleting = false;
    let typewriterStarted = false;
    const typedTextElement = document.getElementById("typed-text");

    function type() {
        if (count === texts.length) count = 0;
        currentText = texts[count];

        if (isDeleting) {
            letter = currentText.slice(0, --index);
        } else {
            letter = currentText.slice(0, ++index);
        }

        typedTextElement.textContent = letter;

        let typeSpeed = 80;
        if (isDeleting) typeSpeed /= 2;
        if (!isDeleting && letter.length === currentText.length) {
            typeSpeed = 2200; // Pause before delete
            isDeleting = true;
        } else if (isDeleting && letter.length === 0) {
            isDeleting = false;
            count++;
            typeSpeed = 400;
        }
        setTimeout(type, typeSpeed);
    }
    
    function startTypewriter() {
        if (!typewriterStarted && typedTextElement) {
            typewriterStarted = true;
            type();
        }
    }

    // Smooth scrolling for navigation links
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu on link click
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
                }
            }
        });
    });

    // Mobile Menu Toggle
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('open');
        });
    }

    // Scroll Reveal Animation using bidirectional Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealOptions = { threshold: 0.05, rootMargin: "-10px 0px -10px 0px" };
        const revealOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                } else {
                    entry.target.classList.remove('active');
                }
            });
        }, revealOptions);

        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('active');
            }
            revealOnScroll.observe(el);
        });
    }

    // GSAP 60fps Scroll and Entrance Choreography (Bidirectional)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            const isMobile = window.innerWidth < 768;

            // Navbar Subtle Entrance
            gsap.from(".navbar", {
                y: -15,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out"
            });

            // Hero Section Typography & Actions Entrance
            const heroTimeline = gsap.timeline({
                defaults: { ease: "power4.out", duration: 0.95 },
                onComplete: () => {
                    startTypewriter();
                }
            });

            heroTimeline
                .from(".hero .title", { y: 40, opacity: 0, duration: 1.05, delay: 0.1 })
                .from(".hero .typing-container", { y: 25, opacity: 0, duration: 0.7 }, "-=0.65")
                .from(".hero .description", { y: 25, opacity: 0, duration: 0.75 }, "-=0.55")
                .from(".hero .hero-links .btn", { 
                    y: 18, 
                    opacity: 0, 
                    stagger: 0.12, 
                    duration: 0.65, 
                    ease: "back.out(1.2)" 
                }, "-=0.45");

            // Subtle re-entrance when scrolling all the way back up to hero
            ScrollTrigger.create({
                trigger: "#home",
                start: "top top",
                end: "bottom 20%",
                onEnterBack: () => {
                    gsap.fromTo([".hero .title", ".hero .typing-container", ".hero .description", ".hero .hero-links .btn"],
                        { opacity: 0.4, y: 15 },
                        { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "power2.out", overwrite: "auto" }
                    );
                }
            });

            // Fallback timer for typewriter in case timeline pauses
            setTimeout(startTypewriter, 600);

            // About Section Card & Skills Entrance (Bidirectional)
            const aboutCard = document.querySelector('#about .card');
            if (aboutCard) {
                gsap.from(aboutCard, {
                    scrollTrigger: {
                        trigger: aboutCard,
                        start: "top 88%",
                        end: "bottom 6%",
                        toggleActions: "play reverse play reverse"
                    },
                    y: 35,
                    opacity: 0,
                    duration: 0.85,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(aboutCard, { clearProps: "all" });
                    }
                });

                const skillCategories = document.querySelectorAll('#about .skill-category');
                if (skillCategories.length > 0) {
                    gsap.from(skillCategories, {
                        scrollTrigger: {
                            trigger: aboutCard,
                            start: "top 82%",
                            end: "bottom 6%",
                            toggleActions: "play reverse play reverse"
                        },
                        y: 20,
                        opacity: 0,
                        stagger: 0.08,
                        duration: 0.65,
                        ease: "power2.out",
                        onComplete: () => {
                            gsap.set(skillCategories, { clearProps: "all" });
                        }
                    });
                }
            }

            // FreeDot Linux - System Pipeline Slide-In from Left (Bidirectional)
            const pipelineStages = document.querySelectorAll('#freedot .pipeline-stage');
            const pipelineOffset = isMobile ? -35 : -60;
            pipelineStages.forEach((stage) => {
                gsap.from(stage, {
                    scrollTrigger: {
                        trigger: stage,
                        start: "top 88%",
                        end: "bottom 6%",
                        toggleActions: "play reverse play reverse"
                    },
                    x: pipelineOffset,
                    opacity: 0,
                    duration: 0.85,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(stage, { clearProps: "all" });
                    }
                });

                const step = stage.querySelector('.stage-step');
                if (step) {
                    gsap.from(step, {
                        scrollTrigger: {
                            trigger: stage,
                            start: "top 88%",
                            end: "bottom 6%",
                            toggleActions: "play reverse play reverse"
                        },
                        scale: 0.65,
                        opacity: 0,
                        duration: 0.6,
                        ease: "back.out(1.5)",
                        delay: 0.1,
                        onComplete: () => {
                            gsap.set(step, { clearProps: "all" });
                        }
                    });
                }
            });

            // Vertical Projects Section - Alternating Slide-In from Left and Right (Bidirectional)
            const projectCards = document.querySelectorAll('#projects .project-card');
            const projectOffset = isMobile ? 35 : 75;
            projectCards.forEach((card, index) => {
                const fromLeft = index % 2 === 0;
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 88%",
                        end: "bottom 6%",
                        toggleActions: "play reverse play reverse"
                    },
                    x: fromLeft ? -projectOffset : projectOffset,
                    scale: 0.98,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(card, { clearProps: "all" });
                    }
                });
            });

            // Open Source Contributions - Rows Slide-In from Left (Bidirectional)
            const contributionRows = document.querySelectorAll('#contributions .contribution-row');
            const contributionOffset = isMobile ? -25 : -45;
            contributionRows.forEach((row) => {
                gsap.from(row, {
                    scrollTrigger: {
                        trigger: row,
                        start: "top 90%",
                        end: "bottom 6%",
                        toggleActions: "play reverse play reverse"
                    },
                    x: contributionOffset,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(row, { clearProps: "all" });
                    }
                });
            });

            // Contact Section Cards - Smooth Staggered Entrance (Bidirectional)
            const contactCards = document.querySelectorAll('#contact .contact-card');
            if (contactCards.length > 0) {
                gsap.from(contactCards, {
                    scrollTrigger: {
                        trigger: "#contact .contact-grid",
                        start: "top 88%",
                        end: "bottom 6%",
                        toggleActions: "play reverse play reverse"
                    },
                    y: 30,
                    opacity: 0,
                    stagger: 0.12,
                    duration: 0.75,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(contactCards, { clearProps: "all" });
                    }
                });
            }

            // Settle animations immediately if preview=settled query parameter is present
            if (window.location.search.includes('preview=settled')) {
                heroTimeline.progress(1);
                startTypewriter();
                ScrollTrigger.getAll().forEach(st => {
                    if (st.animation) st.animation.progress(1);
                });
                const targetParam = new URLSearchParams(window.location.search).get('target');
                if (targetParam) {
                    const sections = ['home', 'about', 'freedot', 'projects', 'contributions', 'news', 'contact'];
                    const targetIdx = sections.indexOf(targetParam);
                    if (targetIdx > 0) {
                        for (let i = 0; i < targetIdx; i++) {
                            const prevEl = document.getElementById(sections[i]);
                            if (prevEl) prevEl.style.display = 'none';
                        }
                    }
                    ScrollTrigger.refresh();
                }
            }
        } else {
            // Instant start if motion reduced
            startTypewriter();
        }
    } else {
        // Fallback if GSAP is unavailable
        startTypewriter();
    }

    // Fetch Live Tech News from Hacker News API
    async function fetchTechNews() {
        const loader = document.getElementById('news-loader');
        const newsList = document.getElementById('news-list');
        try {
            const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            const storyIds = await response.json();
            const top5 = storyIds.slice(0, 5);
            
            const storyPromises = top5.map(id => 
                fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json())
            );
            
            const stories = await Promise.all(storyPromises);
            if (loader) loader.style.display = 'none';
            
            stories.forEach((story) => {
                if (!story) return;
                const li = document.createElement('li');
                li.className = 'news-item';
                const link = story.url ? story.url : `https://news.ycombinator.com/item?id=${story.id}`;
                li.innerHTML = `
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="news-title">${story.title}</a>
                    <div class="news-meta">
                        ${story.score} points by ${story.by} | ${new Date(story.time * 1000).toLocaleDateString()}
                    </div>
                `;
                if (newsList) newsList.appendChild(li);
            });

            // Smooth entrance animation for loaded news items
            if (newsList && typeof gsap !== 'undefined') {
                gsap.from(newsList.children, {
                    y: 15,
                    opacity: 0,
                    stagger: 0.08,
                    duration: 0.55,
                    ease: "power2.out"
                });
            }
        } catch (error) {
            console.error('Error fetching tech news:', error);
            if (loader) loader.innerText = 'Failed to load news feed.';
        }
    }
    
    fetchTechNews();
});
