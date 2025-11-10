const capitalize = (string) => {
    const words = string.split(' ');
    const capitalizedString = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
    return capitalizedString;
}

module.exports = capitalize;