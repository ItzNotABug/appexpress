// serves no purpose except for tests.
document.addEventListener('DOMContentLoaded', function () {
    console.log('Document is ready.');
});

function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element.style.display === 'none') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

document.addEventListener('click', function (event) {
    if (event.target.id === 'toggleButton') {
        toggleVisibility('toggleElement');
    }
});

window.addEventListener('resize', function () {
    console.log(
        'Window size changed. Width: ' +
            window.innerWidth +
            ', Height: ' +
            window.innerHeight,
    );
});
