let categories = [];

// fetches category IDs
async function getCategoryIds() {
    try {
        // gets the category IDs from the API
        const response = await axios.get('https://rithm-jeopardy.herokuapp.com/api/categories?count=100');
        const categories = response.data;
        // selects random categories
        const randomCategories = _.sampleSize(categories, 6);
        return randomCategories.map(category => category.id);
    }
    catch (error) {
        // logs and handles any errors
        console.error('Error fetching category IDs:', error);
        throw error;
    }
}

// fetches category data
async function getCategory(catId) {
    try {
        // gets the data from the API
        const response = await axios.get(`https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`);
        const categoryData = response.data;
        // maps clues from category data
        const clues = categoryData.clues.map(clue => ({
            question: clue.question,
            answer: clue.answer,
            showing: null
        }));
        return { title: categoryData.title, clues };
    }
    catch (error) {
        // logs and handles any errors
        console.error(`Error fetching data for category ${catId}:`, error);
        // return an empty category object if data fetching fails
        return { title: '', clues: [] };
    }
}

// fills table with categories and clues
async function fillTable() {
    const $thead = $('table#jeopardy thead tr');
    const $tbody = $('table#jeopardy tbody');
  
    // clears previous content
    $thead.empty();
    $tbody.empty();
  
    // fills thead with category titles
    for (const category of categories) {
        $thead.append(`<td>${category.title}</td>`);
    }
  
    // fills tbody with clues
    for (let i = 0; i < 5; i++) {
        const $tr = $('<tr></tr>');
        for (const category of categories) {
            const clue = category.clues[i];
            // handles category titles that include quotations
            $tr.append(`<td class="clue" data-category="${encodeURIComponent(category.title)}" data-index="${i}">?</td>`);

        }
        $tbody.append($tr);
    }
}

// handles clicks on the cells
function handleClick(evt) {
    const $clickedCell = $(evt.target);
    // handles category titles that include quotations
    const categoryTitle = decodeURIComponent($clickedCell.data('category'));
    const index = $clickedCell.data('index');
    const category = categories.find(cat => cat.title === categoryTitle);
    const clue = category.clues[index];

    // show question on first click
    if (!clue.showing) {
        $clickedCell.text(clue.question);
        clue.showing = 'question';
    }
    // show answer on second click
    else if (clue.showing === 'question') {
        $clickedCell.text(clue.answer);
        clue.showing = 'answer';
    }

    // highlights cell when answer is clicked
    if (clue.showing === 'answer') {
        $clickedCell.css('background-color', '#388999');
    }

}

// show loading spinner
function showLoadingView() {
    $('#loading').show();
    $('#restart').prop('disabled', true);
}
  
// hide loading spinner
function hideLoadingView() {
    $('#loading').hide();
    $('#restart').prop('disabled', false);
}

// sets up and starts the game
async function setupAndStart() {
    showLoadingView();
    // fetches data and fills table
    const categoryIds = await getCategoryIds();
    categories = await Promise.all(categoryIds.map(catId => getCategory(catId)));
    fillTable();
    hideLoadingView();
}
  
// calls setupAndStart on page load
$(document).ready(setupAndStart);
  
// adds click event for clues
$('table#jeopardy').on('click', '.clue', handleClick);

// starts game when document is ready
$(document).ready(function() {
    setupAndStart();
    // restarts game when button is clicked
    $('#restart').click(function() {
        setupAndStart();
    });
});