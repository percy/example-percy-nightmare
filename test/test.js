const should = require('chai').should();
const Nightmare = require('nightmare');
const httpServer = require('http-server');
const percySnapshot = require('@percy/nightmare');

const PORT = process.env.PORT_NUMBER || 8000;
const TEST_URL = `http://localhost:${PORT}`;

// xvfb wrapper
const xvfb = {
  start: () =>
    new Promise((resolve) => {
      xvfb.instance = new (require('xvfb'))();
      xvfb.instance.start(() => resolve());
    }),

  stop: () =>
    new Promise((resolve) => {
      xvfb.instance.stop(() => resolve());
    })
};

describe('TodoMVC', function () {
  let server, nightmare;

  this.timeout('10s');

  before(async function () {
    await xvfb.start();
    server = httpServer.createServer({ root: `${__dirname}/../` });
    server.listen(PORT);
  });

  beforeEach(function () {
    // Create a new Nightmare instance for each test.
    nightmare = Nightmare();
  });

  after(async function () {
    // Shutdown our http server.
    server.close();
    await xvfb.stop();
  });

  afterEach(function (done) {
    // end the Nightmare instance
    nightmare.end(done);
  });

  it('Loads the app', function (done) {
    nightmare
      // Load the app.
      .goto(TEST_URL)
      // Take a snapshot and upload to Percy
      .use(percySnapshot(this.test.fullTitle(), { widths: [300, 600, 1000] }))
      // Verify that our main app container exists.
      .exists('section.todoapp')
      .then(function (exists) {
        exists.should.be.true;
        done();
      })
      .catch(done);
  });

  it('With no todos, hides main section and footer', function (done) {
    nightmare
      .goto(TEST_URL)
      .visible('.main')
      .then(function (mainVisible) {
        mainVisible.should.be.false;
        return nightmare.visible('.footer');
      })
      .then(function (footerVisible) {
        footerVisible.should.be.false;
        done();
      })
      .catch(done);
  });

  it('Accepts a new todo', function (done) {
    nightmare
      .goto(TEST_URL)
      .evaluate(function () {
        return document.querySelectorAll('.todo-list li').length;
      })
      .then(function (todoListLength) {
        // We start with an empty to-do list.
        todoListLength.should.eq(0);

        // Add a new to-do item.
        return nightmare
          .type('.new-todo', 'New fancy todo')
          .type('.new-todo', '\u000d') // enter
          .wait('.todo-list li')
          .use(percySnapshot('Accepts a new todo'))
          .evaluate(function () {
            return document.querySelectorAll('.todo-list li').length;
          });
      })
      .then(function (todoListLength) {
        // Our to-do list should contain 1 element.
        todoListLength.should.eq(1);
        done();
      })
      .catch(done);
  });

  it('Lets you check off a todo', function (done) {
    nightmare
      .goto(TEST_URL)
      .type('.new-todo', 'A thing to accomplish')
      .type('.new-todo', '\u000d') // enter
      .evaluate(function () {
        return document.querySelector('.todo-count').textContent;
      })
      .then(function (itemCountText) {
        itemCountText.should.eq('1 item left');

        return nightmare
          .click('input.toggle')
          .use(percySnapshot('Checked-off todo', { widths: [300, 600, 1000] }))
          .evaluate(function () {
            return document.querySelector('.todo-count').textContent;
          });
      })
      .then(function (itemCountText) {
        itemCountText.should.eq('0 items left');
        done();
      })
      .catch(done);
  });
});
