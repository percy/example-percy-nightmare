const should = require('chai').should()
const Nightmare = require('nightmare')

const TEST_URL = "http://localhost:8000"

describe('TodoMVC', function () {
  this.timeout('10s')

  let nightmare = null
  beforeEach(function () {
    // Create a new Nightmare instance for each test.
    nightmare = new Nightmare()
  })

  afterEach(function (done) {
    // end the Nightmare instance
    nightmare.end(done)
  })

  it('Loads the app', function (done) {
    nightmare
      // Load the app.
      .goto(TEST_URL)
      // Verify that our main app container exists.
      .exists('section.todoapp')
      .then(function (exists) {
        exists.should.be.true
        done()
      })
      .catch(done)
  })

  it('With no todos, hides main section and footer', function (done) {
    nightmare
      .goto(TEST_URL)
      .visible('.main')
      .then(function (mainVisible) {
        mainVisible.should.be.false
        return nightmare.visible('.footer')
      })
      .then(function (footerVisible) {
        footerVisible.should.be.false
        done()
      })
      .catch(done)
  })

  it('Accepts a new todo', function (done) {
    nightmare
      .goto(TEST_URL)
      .evaluate(function () {
        return document.querySelectorAll('.todo-list li').length
      })
      .then(function (todoListLength) {
        // We start with an empty to-do list.
        todoListLength.should.eq(0)

        // Add a new to-do item.
        return nightmare.type('.new-todo', 'New fancy todo')
          .wait('.todo-list li')
          .evaluate(function () {
            return document.querySelectorAll('.todo-list li').length
          })
      })
      .then(function (todoListLength) {
        // Our to-do list should contain 1 element.
        todoListLength.should.eq(1)
        done()
      })
      .catch(done)
  })

  it('Lets you check off a todo', function (done) {
    nightmare
      .goto(TEST_URL)
      .type('.new-todo', 'A thing to accomplish')
      .evaluate(function () {
        return document.querySelector('.todo-count').textContent
      })
      .then(function (itemCountText) {
        itemCountText.should.eq('1 item left')

        return nightmare
          .click('input.toggle')
          .evaluate(function () {
            return document.querySelector('.todo-count').textContent
          })
      })
      .then(function (itemCountText) {
        itemCountText.should.eq('0 items left')
        done()
      })
      .catch(done)
  })
})
