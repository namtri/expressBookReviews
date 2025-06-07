const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

/**
 * Wanted a quick method to format the books object ahead of returning
 * the result to the user.
 * 
 * @param {object} dataToFormat The list of books to stringify
 * @param {boolean} excludeReviews Defaults to true, excludes the reviews from the formatted data
 * @returns 
 */
const formattedJSON = (dataToFormat, excludeReviews=true) => {
    let formattedData = (
        excludeReviews 
        ?
        Object.fromEntries(
            Object.entries(dataToFormat).filter(([key, book]) => {
                // the notes say the book details should contain: ISBN, Title, and Author.
                // So delete the reviews for the public user output.
                delete book.reviews;
                return true;
            }), 
            null, 4
        )
        :
        dataToFormat
    );

    // The teacher suggests using JSON.stringify?  ok...
    return JSON.stringify(formattedData, null, 4);
};

public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (isValid(username)) {
            users.push({ "username": username, "password": password});
            return res.status(200).json({ message: "User successfully registered." });
        } else {
            return res.status(403).json({ message: "User already exists." });
        }
    }

    return res.status(400).json({ message: "Unable to register user." });
});

// Get the book list available in the shop
const getAllBooks = async () => {
    return books;
};

public_users.get('/', async function (req, res) {
    const get_books = await getAllBooks();
    return res.status(200).json(formattedJSON(get_books));
});

// Get book details based on ISBN
const getBooksByISBN = async (isbn) => {
    return Object.fromEntries(
        Object.entries(books).filter(([key, book]) => key === isbn)
    );
};

public_users.get('/isbn/:isbn', async function (req, res) {
    const isbn = req.params.isbn;

    const books_by_isbn = await getBooksByISBN(isbn);
    if (Object.keys(books_by_isbn).length > 0) {
        return res.status(200).json(formattedJSON(books_by_isbn));
    }

    return res.status(404).json({ "message": `No book with ISBN ${isbn} found.`});
 });
  
// Get book details based on author
const getBooksByAuthor = async (author) => {
    return Object.fromEntries(
        Object.entries(books).filter(([key, book]) => book.author === author)
    );
};

public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;

    const books_by_author = await getBooksByAuthor(author);
    if (Object.keys(books_by_author).length > 0) {
        return res.status(200).json(books_by_author);
    }

    return res.status(404).json({ "message": `No books by ${author} were found` });
});

// Get all books based on title
const getBooksByTitle = async (title) => {
    return Object.fromEntries(
        Object.entries(books).filter(([key, book]) => book.title === title)
    );
};

public_users.get('/title/:title', async function (req, res) {
    const title = req.params.title;

    const books_by_title = await getBooksByTitle(title);
    if (Object.keys(books_by_title).length > 0) {
        return res.status(200).json(books_by_title);
    }

    return res.status(404).json({ "message": `No books titled '${title}' were found` });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;

    if (books[isbn]) {
        let reviews = books[isbn].reviews;
        return res.status(200).json(formattedJSON(reviews));
    }

    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

module.exports.general = public_users;
