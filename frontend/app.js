/**
 * Builddy SaaS Scaffold — Frontend App (Landing Page)
 * Toast notifications, API client, scroll animations, carousel, parallax, counters.
 *
 * Modification Points:
 *   // {{API_METHODS_INSERTION_POINT}}  — Add custom API methods here
 *   // {{RENDER_INSERTION_POINT}}       — Add custom page renderers here
 */

(function () {
  "use strict";

  const API_BASE = "/api";

  // --- Toast ---
  function showToast(msg, type = "info", dur = 4000) {
    const c = document.getElementById("toastContainer");
    const colors = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500", warning: "bg-yellow-500 text-black" };
    const t = document.createElement("div");
    t.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg toast-enter`;
    t.innerHTML = `<span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.classList.add("toast-exit"); setTimeout(() => t.remove(), 300); }, dur);
  }

  // --- API Client ---
  async function apiFetch(endpoint, options = {}) {
    const headers = { "Content-Type": "application/json" };
    const config = { headers, ...options };
    if (config.body && typeof config.body === "object") config.body = JSON.stringify(config.body);
    let response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  const api = {
    health: () => apiFetch("/health"),
    // {{API_METHODS_INSERTION_POINT}}
    subscribeNewsletter: (email) => apiFetch("/newsletter/subscribe", { method: "POST", body: { email } }),
  };

  // --- Utility ---
  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // --- Sticky Nav ---
  function initStickyNav() {
    const nav = document.getElementById("mainNav");
    if (!nav) return;

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          nav.classList.toggle("shadow-lg", !entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    navObserver.observe(document.querySelector(".hero-section"));
  }

  // --- Dark Mode Toggle ---
  function initDarkMode() {
    const htmlEl = document.documentElement;
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    // Set initial mode from localStorage or system preference
    const storedDarkMode = localStorage.getItem("darkMode");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (storedDarkMode === "true" || (!storedDarkMode && systemPrefersDark)) {
      htmlEl.classList.add("dark");
    } else {
      htmlEl.classList.remove("dark");
    }

    // Toggle handler
    toggle.addEventListener("click", () => {
      htmlEl.classList.toggle("dark");
      localStorage.setItem("darkMode", htmlEl.classList.contains("dark") ? "true" : "false");
    });
  }

  // --- Smooth Scrolling ---
  function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    const headerHeight = document.querySelector("#mainNav")?.offsetHeight || 0;

    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        if (targetId === "#") return;
        
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;
        
        e.preventDefault();
        
        const position = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({
          top: position,
          behavior: "smooth"
        });
      });
    });
  }

  // --- Scroll Animations ---
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          // Don't unobserve to allow re-animation when scrolling back
        }
      });
    }, { threshold: 0.1 });
    
    animatedElements.forEach(el => observer.observe(el));
  }

  // --- Hero Parallax ---
  function initHeroParallax() {
    const heroSection = document.querySelector('.hero-section');
    const mockup = document.querySelector('.hero-mockup');
    
    if (!heroSection || !mockup) return;
    
    heroSection.addEventListener('mousemove', (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      mockup.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    });
    
    heroSection.addEventListener('mouseleave', () => {
      mockup.style.transform = 'translate(0, 0)';
    });
  }

  // --- Counter Animation ---
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          const target = +entry.target.getAttribute('data-target');
          const duration = +entry.target.getAttribute('data-duration') || 2000;
          const increment = target / (duration / 16);
          
          let current = 0;
          
          const updateCounter = () => {
            current += increment;
            if (current < target) {
              entry.target.textContent = Math.floor(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              entry.target.textContent = target.toLocaleString();
              entry.target.classList.add('counted');
            }
          };
          
          updateCounter();
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
  }

  // --- Testimonial Carousel ---
  function initTestimonialCarousel() {
    const carousel = document.querySelector('.testimonial-carousel');
    const track = document.querySelector('.carousel-track');
    const slides = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (!carousel || !track || !slides.length) return;
    
    let currentIndex = 0;
    let autoplayInterval;
    const slideWidth = slides[0].offsetWidth;
    
    // Update carousel position
    function updateCarousel() {
      track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
      
      // Update dots
      dots.forEach((dot, i) => {
        dot.classList.toggle('bg-primary-500', i === currentIndex);
        dot.classList.toggle('bg-gray-300', i !== currentIndex);
      });
    }
    
    // Go to next slide
    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    }
    
    // Go to previous slide
    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel();
    }
    
    // Set up autoplay
    function startAutoplay() {
      autoplayInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoplay() {
      clearInterval(autoplayInterval);
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
      nextSlide();
      stopAutoplay();
      startAutoplay();
    });
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
      prevSlide();
      stopAutoplay();
      startAutoplay();
    });
    
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        currentIndex = i;
        updateCarousel();
        stopAutoplay();
        startAutoplay();
      });
    });
    
    // Pause on hover
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    
    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
    
    function handleSwipe() {
      if (touchEndX < touchStartX - 50) nextSlide();
      if (touchEndX > touchStartX + 50) prevSlide();
    }
    
    // Start autoplay
    startAutoplay();
  }

  // --- Newsletter Form ---
  function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    const emailInput = document.getElementById('emailInput');
    const errorMessage = document.getElementById('emailError');
    const submitButton = document.getElementById('submitButton');
    
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Reset previous state
      if (errorMessage) errorMessage.classList.add('hidden');
      if (submitButton) submitButton.disabled = false;
      
      // Validate email
      const email = emailInput.value.trim();
      if (!emailRegex.test(email)) {
        if (errorMessage) {
          errorMessage.textContent = 'Please enter a valid email address';
          errorMessage.classList.remove('hidden');
        }
        return;
      }
      
      // Disable button during submission
      if (submitButton) submitButton.disabled = true;
      
      try {
        await api.subscribeNewsletter(email);
        showToast('Successfully subscribed to newsletter!', 'success');
        form.reset();
      } catch (error) {
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Subscription failed. Please try again.';
          errorMessage.classList.remove('hidden');
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  // --- Active Nav Highlight ---
  function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const highlightNav = () => {
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        
        if (scrollPosition >= top && scrollPosition < top + height) {
          navLinks.forEach(link => {
            link.classList.remove('text-primary-600', 'font-medium');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('text-primary-600', 'font-medium');
            }
          });
        }
      });
    };
    
    window.addEventListener('scroll', highlightNav);
    highlightNav(); // Run once on load
  }

  // --- Mobile Menu ---
  function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!menuToggle || !mobileMenu) return;
    
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // --- Back to Top Button ---
  function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    if (!backToTopBtn) return;
    
    const toggleBackToTop = () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.remove('hidden');
      } else {
        backToTopBtn.classList.add('hidden');
      }
    };
    
    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop(); // Run once on load
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Analytics ---
  function initAnalytics() {
    // Track page view
    apiFetch('/analytics/track', {
      method: 'POST',
      body: {
        event_type: 'page_view',
        page: window.location.pathname
      }
    }).catch(err => console.log('Analytics error:', err));
    
    // Track section views
    const sections = document.querySelectorAll('section[data-track]');
    
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('tracked')) {
          const sectionName = entry.target.getAttribute('id') || entry.target.getAttribute('data-track');
          
          apiFetch('/analytics/track', {
            method: 'POST',
            body: {
              event_type: 'section_view',
              page: window.location.pathname,
              section: sectionName
            }
          }).catch(err => console.log('Analytics error:', err));
          
          entry.target.classList.add('tracked');
        }
      });
    }, { threshold: 0.5 });
    
    sections.forEach(section => sectionObserver.observe(section));
  }

  // --- Initialize all functionality on DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initSmoothScroll();
    initScrollAnimations();
    initHeroParallax();
    initCounterAnimation();
    initTestimonialCarousel();
    initNewsletterForm();
    initActiveNavHighlight();
    initMobileMenu();
    initBackToTop();
    initAnalytics();
    initStickyNav();
  });

})();