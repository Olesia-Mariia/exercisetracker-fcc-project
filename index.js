const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
})

const UserModel = mongoose.model('User', userSchema)

// Exercise Schema
const exerciseSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
})

const ExerciseModel = mongoose.model('Exercise', exerciseSchema)

app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.route('/api/users')
  .get((req, res) => {
    UserModel.find({}).then((users) => res.json(users))
  })
  .post((req, res) => {
    const username = req.body.username
    const newUser = new UserModel({username})
    newUser.save()
    res.json(newUser)
  })

app.post("/api/users/:_id/exercises", (req, res) => {
  const { description, duration, date } = req.body
  const id = req.params._id

  UserModel.findById(id).then(user => {
    if (!user) {
      res.send("User with this id isn't exist")
      return
    }
    const exercise = new ExerciseModel({
      userID: user._id,
      username: user.username,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    })
    exercise.save()
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    })
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  const id = req.params._id 
  const {from, to, limit} = req.query
  const filter = {
    userID: id
  }

  const date = {}
  if (from) {
    date['$gte'] = new Date(from)
    filter.date = date
  }
  if (to) {
    date['$lte'] = new Date(to)
    filter.date = date
  }
  
  UserModel.findById(id).then(user => {
    if (!user) {
      res.send("User with this id isn't exist")
      return
    }

    ExerciseModel.find(filter).limit(limit ? +limit : 1000 ).then(exercises => {
      if (!exercises) {
        res.send("This user doesn't have any exercises")
        return
      }
  
      res.json({
        username: user.username,
        count: exercises.length,
        _id: user._id,
        log: exercises.map(ex => {
          return {
            description: ex.description,
            duration: ex.duration,
            date: new Date(ex.date).toDateString(),
          }
        })
      })
    })
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
