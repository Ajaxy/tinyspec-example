swagger: '2.0'
info:
  title: Example API v2
  description: |-
    This document describes HTTP REST JSON API located at https://{{host}}/api/v2
    and used by **Example** mobile and desktop clients.

    An actual version of this document is published online: https://docs.example.com/api/{{environment}}
  version: "{{version}}"
host: "{{host}}"
basePath: /api/v2
schemes:
  - https
consumes:
  - application/json
produces:
  - application/json
securityDefinitions:
  token:
    name: X-Access-Token
    type: apiKey
    in: header
