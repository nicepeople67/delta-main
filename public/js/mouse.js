// What is this even for? Why can't this be consolidated into one file? In fact, why can't everything just be one file? Such questions keep us awake at night
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.sidebar-nav nav a');

    navItems.forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const x_percent = (x / rect.width) * 100;
            const y_percent = (y / rect.height) * 100;

            item.style.setProperty('--mouse-x', `${x_percent}%`);
            item.style.setProperty('--mouse-y', `${y_percent}%`);
        });

        item.addEventListener('mouseleave', () => {

        });
    });
});
