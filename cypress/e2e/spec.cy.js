describe('Example spec', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should render intro-container', () => {
    cy.get('#intro-container')
      .get('h1')
      .contains('Intro')
  })

  it('should transform value on scroll', () => {
    cy.get('#intro-container')
      .get('h1')
      .should('have.attr', 'style')
      .should('contain', 'transform: scale(1)')

    cy.scrollTo('0', '300')

    cy.get('#intro-container')
      .get('h1')
      .should('have.attr', 'style')
      .should('contain', 'transform: scale(20)')
  })
})