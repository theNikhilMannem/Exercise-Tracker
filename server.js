const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// MongoDb Connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const { Schema } = mongoose;

// Creating the Schemata for a User and Exercise
const personSchema = new Schema({
  username: { type: String, required: true, unique: true }
})

const exerciseSchema = new Schema({
  userId: String, description: String, duration: Number, date: Date
})

// Creating Person and Exercise Models for the Schema above
const Person = mongoose.model('Person', personSchema)
console.log(Person)
const Exercise = mongoose.model('Exercise', exerciseSchema)
console.log(Exercise)

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }))

// Endpoint to create a new 'User'
app.post('/api/exercise/new-user', (req, res, next) => {
  const { username } = req.body
  
  if (username) {
    const person = new Person({ username })
    person.save((err, data) => {
      if (!data) {
        res.send("the username's taken, try something else!")
      }
      else {
        res.json({ username: data.username, _id: data.id })
      }
    })
  }
  else {
    res.send("Enter a Username!")
  }
})

app.get('/api/exercise/users', (req, res, next) => {
  Person.find({}, (err, people) => {
    if (!people) {
      res.send("No users created yet! Let's change that: go back, create one ;)")
    }
    else {
      res.send(people)
    }
  })
})

app.post('/api/exercise/add', (req, res, next) => {
  const { userId, description, duration, date } = req.body

  if (userId) {
    Person.findById(
      userId,
      (err, person) => {
        if (!person) {
          res.send("No user goes by this userId. Try again with another userId!")
        }
        else {
          const username = person.username
          const exercise = new Exercise({
            userId, description, duration, date
          })
          exercise.save((err, exer) => {
            if (!exer) {
              res.send("Exercise couldn't be saved!")
            }
            else {
              console.log(exer)
              res.json({
                _id: userId,
                username,
                description,
                duration: parseInt(duration),
                date: date ? new Date(date).toDateString() : new Date().toDateString()
              })
            }
          })
        }
      }
    )
  }
})

app.get('/api/exercise/log', (req, res, next) => {
  const { userId, from, to, limit } = req.query
  
  Person.findById(
    userId,
    (err, person) => {
      if (!person) {
        res.send("Person with the userId doesn't exist here, yet!")
      }
      else {
        const username = person.username
        
        Exercise.find(
          { userId },
          {
            date: {
              $gte: new Date(from),
              $lte: new Date(to)
            }
          }
        )
        .select(['_id', 'description', 'duration', 'date'])
        .limit(+limit)
        .exec((err, exercises) => {
          if (!exercises) {
            res.json('No Exercises found for the given search!')
          }
          else {
            console.log(exercises)
            res.json({
              userId: userId,
              username: username,
              count: exercises.length,
              log: exercises.map(ex => ({
                id: ex.id,
                description: ex.description,
                duration: ex.duration,
                date: new Date(ex.date).toDateString()
              }))
            })
          }
        })
      }
    }
  )
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
