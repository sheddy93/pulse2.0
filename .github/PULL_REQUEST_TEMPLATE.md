name: Pull Request

description: Submit changes to the project
title: "[PR] "
labels: []
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        ## Pull Request Description
        Please describe your changes and the motivation for them.

  - type: textarea
    id: description
    attributes:
      label: Description
      description: A clear and concise description of what the PR does.
      placeholder: |
        - What changed?
        - Why was this change needed?
        - What issue does this PR fix? (if applicable)
    validations:
      required: true

  - type: textarea
    id: type
    attributes:
      label: Type of Change
      description: What type of change does this PR introduce?
      placeholder: |
        - [ ] Bug fix
        - [ ] New feature
        - [ ] Breaking change
        - [ ] Documentation update
        - [ ] Refactoring
        - [ ] Performance improvement
        - [ ] Test update
      validations:
      required: true

  - type: checkboxes
    id: checklist
    attributes:
      label: PR Checklist
      options:
        - label: My code follows the project's coding style
          required: true
        - label: I have performed a self-review of my code
          required: true
        - label: I have commented my code, particularly in hard-to-understand areas
          required: false
        - label: I have made corresponding changes to the documentation
          required: false
        - label: My changes generate no new warnings
          required: false
        - label: I have added tests that prove my fix is effective or that my feature works
          required: false
        - label: New and existing unit tests pass locally with my changes
          required: false
        - label: I have checked that my branch is up to date with main
          required: true

  - type: textarea
    id: testing
    attributes:
      label: Testing Done
      description: Describe the testing you performed.
      placeholder: |
        - Unit tests added/updated
        - Integration tests added/updated
        - Manual testing performed
    validations:
      required: false

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If applicable, add screenshots of the changes.
      placeholder: Drag and drop or paste screenshots here...
    validations:
      required: false

  - type: input
    id: ticket
    attributes:
      label: Related Ticket
      description: Link to related ticket or issue (e.g., "Closes #123")
      placeholder: "Closes #123"
    validations:
      required: false

  - type: textarea
    id: notes
    attributes:
      label: Additional Notes
      description: Any additional notes for the reviewers.
      placeholder: Additional notes...
    validations:
      required: false

  - type: dropdown
    id: review-type
    attributes:
      label: Review Type
      description: What kind of review are you looking for?
      options:
        - Ready for review
        - Draft (seeking early feedback)
        - Work in progress
      default: 0
    validations:
      required: true

  - type: checkboxes
    id: breaking
    attributes:
      label: Breaking Changes
      options:
        - label: This PR contains breaking changes
          required: false