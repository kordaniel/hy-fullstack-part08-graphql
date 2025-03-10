const mongoose = require('mongoose');
//const uniqueValidator = require('@ladjs/mongoose-unique-validator');
// NOTE: I intentionally left the dependence in package.json for the course staff, see comment on line 34

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    minLength: 5
  },
  published: {
    type: Number
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author'
  },
  genres: [
    { type: String }
  ]
});

/* NOTE: apollo strips _id
schema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});
*/

// mongoose-unique-validator does not support mongoose v. 8.x (current stable, 03/2025).
// @ladjs fork does, but then all validations fail with:
// Book validation failed: title: Query.prototype.countDocuments() no longer accepts a callback
//schema.plugin(uniqueValidator);

module.exports = mongoose.model('Book', schema);
