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
    const getBooks = () => {
        return new Promise((resolve, reject) => {
            resolve(books);
        });
    };

    getBooks()
        .then((books) => {
            res.json(formattedJSON(books));
        })
        .catch((error) => {
            res.status(500).json({ "message": "Could not retrieve data"});
        });
    // synchronous response below
    // return res.status(200).json(formattedJSON(books));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
    const isbn = req.params.isbn;

    const getBooks = (isbn) => {
        return new Promise((resolve, reject) => {
            let bookByISBN = Object.fromEntries(
                Object.entries(books).filter(([key, book]) => key === isbn)
            );
            
            if (Object.keys(bookByISBN).length) {
                resolve(bookByISBN);
            } else {
                reject(new Error(`Book with ISBN ${isbn} not found`));
            }
        });
    };

    getBooks(isbn)
        .then((book) => {
            res.json(formattedJSON(book));
        })
        .catch((error) => {
            res.status(404).json({ "message": error.message });
        });
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
    const author = req.params.author;

    const getBooks = (author) => {
        return new Promise((resolve, reject) => {
            let booksByAuthor = Object.fromEntries(
                Object.entries(books).filter(([key, book]) => book.author === author)
            );

            if (Object.keys(booksByAuthor).length > 0) {
                resolve(booksByAuthor);
            } else {
                reject(new Error(`No books found by author: ${author}`));
            }
        });
    };

    getBooks(author)
        .then((books) => {
            res.json(formattedJSON(books));
        })
        .catch((error) => {
            res.status(404).json({ "message": error.message });
        });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
    const title = req.params.title;

    const getBook = (title) => {
        return new Promise((resolve, reject) => {
            let booksByTitle = Object.fromEntries(
                Object.entries(books).filter(([key, book]) => book.title === title)
            );

            if (Object.keys(booksByTitle).length > 0) {
                resolve(booksByTitle);
            } else {
                reject(new Error(`${title} not found`));
            }
        });
    };

    getBook(title)
        .then((book) => {
            res.json(formattedJSON(book));
        })
        .catch((error) => {
            res.status(404).json({ "message": error.message});
        });
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
