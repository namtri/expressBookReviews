const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

/**
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
                delete book.reviews;
                return true;
            }), 
            null, 4
        )
        :
        dataToFormat
    );

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
public_users.get('/',function (req, res) {
    return res.status(200).json(formattedJSON(books));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
    const isbn = req.params.isbn;

    let bookByISBN = Object.fromEntries(
        Object.entries(books).filter(([key, book]) => key === isbn)
    );

    return (bookByISBN ? 
        res.status(200).json(formattedJSON(bookByISBN)) :
        res.status(404).json({ message: `Book with ISBN ${isbn} not found`})
    );
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
    const author = req.params.author;

    let booksByAuthor = Object.fromEntries(
        Object.entries(books).filter(([key, book]) => book.author === author)
    );
    
    return (booksByAuthor ?
        res.status(200).json(formattedJSON(booksByAuthor)) :
        res.status(404).json({ message: `No books found by author: ${author}` })
    );
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
    const title = req.params.title;

    let booksByTitle = Object.fromEntries(
        Object.entries(books).filter(([key, book]) => book.title === title)
    );

    return ( booksByTitle ?
        res.status(200).json(formattedJSON(booksByTitle)) :
        res.status(404).json({ message: `${title} not found` })
    ); 
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
