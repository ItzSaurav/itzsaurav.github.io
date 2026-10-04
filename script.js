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
    
    if (typedTextElement) {
        type();
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

    // Scroll Reveal Animation using Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -30px 0px" };
    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // GSAP Scroll Sliding Animations
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!prefersReducedMotion) {
            // Hero Typography Slide-In
            const heroTimeline = gsap.timeline({
                defaults: { ease: "power3.out", duration: 0.9 }
            });

            heroTimeline
                .from(".hero .title", { y: 40, opacity: 0, delay: 0.15 })
                .from(".hero .typing-container", { y: 30, opacity: 0 }, "-=0.6")
                .from(".hero .description", { y: 30, opacity: 0 }, "-=0.6")
                .from(".hero .hero-links .btn", { y: 20, opacity: 0, stagger: 0.15 }, "-=0.5");

            // FreeDot Linux - System Pipeline Slide-In (Sequential as you scroll down)
            const pipelineStages = document.querySelectorAll('#freedot .pipeline-stage');
            pipelineStages.forEach((stage) => {
                gsap.from(stage, {
                    scrollTrigger: {
                        trigger: stage,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    x: -60,
                    opacity: 0,
                    duration: 0.85,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(stage, { clearProps: "transform" });
                    }
                });
            });

            // Vertical Projects Section - Project Cards Alternating Slide-In
            const projectCards = document.querySelectorAll('#projects .project-card');
            projectCards.forEach((card, index) => {
                const fromLeft = index % 2 === 0;
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    x: fromLeft ? -75 : 75,
                    opacity: 0,
                    duration: 0.9,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(card, { clearProps: "transform" });
                    }
                });
            });

            // Open Source Contributions - Rows Slide-In
            const contributionRows = document.querySelectorAll('#contributions .contribution-row');
            contributionRows.forEach((row) => {
                gsap.from(row, {
                    scrollTrigger: {
                        trigger: row,
                        start: "top 88%",
                        toggleActions: "play none none none"
                    },
                    x: -45,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    onComplete: () => {
                        gsap.set(row, { clearProps: "transform" });
                    }
                });
            });

            // Settle animations immediately if preview=settled query parameter is present
            if (window.location.search.includes('preview=settled')) {
                heroTimeline.progress(1);
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
        }
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
            
            stories.forEach((story, index) => {
                if (!story) return;
                const li = document.createElement('li');
                li.className = 'news-item';
                li.style.animationDelay = `${index * 0.1}s`; 
                const link = story.url ? story.url : `https://news.ycombinator.com/item?id=${story.id}`;
                li.innerHTML = `
                    <a href="${link}" target="_blank" rel="noopener noreferrer" class="news-title">${story.title}</a>
                    <div class="news-meta">
                        ${story.score} points by ${story.by} | ${new Date(story.time * 1000).toLocaleDateString()}
                    </div>
                `;
                if (newsList) newsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching tech news:', error);
            if (loader) loader.innerText = 'Failed to load news feed.';
        }
    }
    
    fetchTechNews();
});
