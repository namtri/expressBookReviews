const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{
    let userWithUsername = users.filter((user) => {
        return user.username === username;
    });

    return (userWithUsername.length > 0 ? false : true);
}

const authenticatedUser = (username,password)=>{
    let validUsers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    console.log("num valid users:", validUsers.length);

    return (validUsers.length > 0 ? true : false);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;
    console.log({username, password});

    if (!username || !password) {
        return res.status(404).json({ message: "User not found"});
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60});

        req.session.authorization = {
            accessToken, username
        };

        res.status(200).send("User successfully logged in");
    } else {
        res.status(208).json({ message: "Invalid Login.  Check username and password"});
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username; // Use the session information for the username, so we aren't relying on user input data
    const review = req.body.review;

    let book = books[isbn];
    if (book) {
        book.reviews[username] = review;
        books[isbn] = book;
        res.status(200).json({ "message": "Successfully added your review." });
    }

    res.status(400).json({ "message": "Failed to add your review." });
});

// delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    let book = books[isbn];
    if (book) {
        delete book.reviews[username];
        books[isbn] = book;
        res.status(200).json({ "message": `Successfully removed review by ${username}` })
    }

    res.status(400).json({ "message": "Failed to delete your review."});
})

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
