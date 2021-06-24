import { todosEndpoint, getUserEndpoint, pageUrl } from '../../../src/consts/urls';

function authorize(todosListType: string) {
  cy.intercept(
      'GET',
      getUserEndpoint,
      { fixture: "user.response.json" }
  ).as('authorize');

  cy.intercept(
      'GET',
      todosEndpoint,
      { fixture: todosListType }
  ).as('initialTodos');

  cy.visit(pageUrl)
      .wait('@authorize')
      .wait('@initialTodos');
}

describe('Manage Todos', () => {
  context('Creation', () => {
    it('Create todo', () => {
      cy.fixture('todo-item.response.json').then((todoItemResponse)  => {
        cy.intercept(
            'POST',
            todosEndpoint,
            req => {
              const { body } = req;
              req.reply({
                statusCode: 200,
                body: JSON.stringify({
                  ...todoItemResponse,
                  text: body.text
                })
              });
            }
        ).as('createTodo');
      });

      authorize('empty-todos-list.response.json');


      const itemText = Math.random().toString() + '_' + Date.now();
      cy.get('[data-test-id=create-new-todo-form]').should('be.visible');
      cy.get('[data-test-id=create-new-todo-form__todo-text-input]').type(itemText);
      cy.get('[data-test-id=create-new-todo-form]').submit();

      cy.wait('@createTodo');

      cy.get('[data-test-id=todos-list]').should('be.visible');
      cy.get('[data-test-id=todo-item]').should('be.visible');
      cy.get('[data-test-id=todo-item__checked-checkbox]').should('not.be.checked');
      cy.get('[data-test-id=todo-item__text-input]').should('have.value', itemText);
      cy.get('[data-test-id=todo-item__remove-action]').should('be.visible');
    });
  });

  context('Delete', () => {
    it('delete todo', () => {

      authorize('one-todo-item.response.json');

      cy.fixture('todo-item.response.json').then((todoItemResponse) => {
        let todoID = todoItemResponse['id'];
        cy.intercept(
            'DELETE',
            todosEndpoint,
            req => {
              const {body} = req;
              req.reply({
                statusCode: 200,
                body: JSON.stringify({
                  id: todoID
                })
              });
            }
        ).as('deleteTodo');
      });

      cy.get('[data-test-id=todos-list]').should('be.visible');
      cy.get('[data-test-id=todo-item]').should('be.visible');
      cy.get('[data-test-id=todo-item__remove-action]').click({force: true});
      cy.get('[data-test-id=todos-list]').should('be.empty');

      cy.wait('@deleteTodo');
    });
  });
});
