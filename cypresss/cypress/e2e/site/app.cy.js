describe('SIPPEC App End-to-End', () => {
  const testUser = {
    first_name: 'Test',
    last_name: 'User',
    email: `testuser${Date.now()}@example.com`,
    password: 'testpassword',
    role: 'student',
    type: 'STUDENT'
  };

  it('should register a new user', () => {
    cy.visit('http://localhost:30000/register');
    cy.get('input[name="first_name"]').type(testUser.first_name);
    cy.get('input[name="last_name"]').type(testUser.last_name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="role"]').type(testUser.role);
    // Open the "Type" dropdown and select "STUDENT"
//cy.get('input[name="Type"]').click();
//cy.get('li[data-value="STUDENT"]').click();

cy.get('button[type="submit"]').click();
cy.contains('Account created successfully').should('exist');
    // cy.get('div[role="button"][id^="mui-component-select-type"]').click();
    // cy.get('li[data-value="STUDENT"]').click();
    // cy.get('button[type="submit"]').click();
    // cy.contains('Account created successfully').should('exist');
  });

  it('should login with the new user', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('exist');
  });

  it('should access the profile page and update profile', () => {
    cy.visit('http://localhost:3000/profile');
    cy.get('input[name="first_name"]').clear().type('Updated');
    cy.get('button[type="submit"]').click();
    cy.contains('Profile updated successfully').should('exist');
  });

  it('should access exam requests and export data', () => {
    cy.visit('http://localhost:3000/exam-requests');
    cy.contains('Exam Requests').should('exist');
    cy.get('button').contains('Export to Excel').should('exist');
    cy.get('button').contains('Export to PDF').should('exist');
    // Optionally, click and check download, but Cypress can't verify file content by default
  });

  it('should logout and restrict dashboard access', () => {
    cy.get('button').contains('Logout').click();
    cy.visit('http://localhost:3000/dashboard');
    cy.url().should('include', '/login');
  });
});