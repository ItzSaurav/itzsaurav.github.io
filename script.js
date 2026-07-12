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

    // Typing Effect
    const texts = ["Backend Developer.", "Automation Specialist.", "AI Engineer.", "Problem Solver."];
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

        let typeSpeed = 100;
        if (isDeleting) typeSpeed /= 2;
        if (!isDeleting && letter.length === currentText.length) {
            typeSpeed = 2000; // Pause before delete
            isDeleting = true;
        } else if (isDeleting && letter.length === 0) {
            isDeleting = false;
            count++;
            typeSpeed = 500;
        }
        setTimeout(type, typeSpeed);
    }
    
    if(typedTextElement) {
        type();
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close mobile menu on link click
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    if (mobileMenuBtn) mobileMenuBtn.classList.remove('open');
                }
            }
        });
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
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
            loader.style.display = 'none';
            
            stories.forEach((story, index) => {
                if(!story) return;
                const li = document.createElement('li');
                li.className = 'news-item';
                li.style.animationDelay = `${index * 0.1}s`; 
                const link = story.url ? story.url : `https://news.ycombinator.com/item?id=${story.id}`;
                li.innerHTML = `
                    <a href="${link}" target="_blank" class="news-title">${story.title}</a>
                    <div class="news-meta">
                        ${story.score} points by ${story.by} | ${new Date(story.time * 1000).toLocaleDateString()}
                    </div>
                `;
                newsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching tech news:', error);
            loader.innerText = 'Failed to load news. Please try again later.';
        }
    }
    
    fetchTechNews();
});
