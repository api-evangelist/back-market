# Backmarket API Guidelines ruleset

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 RFC2119 RFC8174 when, and only when, they appear in all capitals, as shown here.

- *MUST* rules trigger errors during API linting
- *SHOULD* rules trigger warnings during API linting


## backmarket-ensure-contact-have-slack-contact

Every API contract *MUST* contain the slack contact of its team epresented as slack channel or group alias.

```yaml
openapi: 3.0.2
info:
  title: Product API
  description: Backmarket core product API
  version: 1.0
  contact:
    name: browsing team
    email: <team-name>@backmarket.com
    url: <link to the team page>
    x-slack: #bot-growth-love
    ....
```



## backmarket-ensure-param-description

Every parameter *SHOULD* include a description to help API users understand how to use it.

```yaml
....
parameters:
	- name: Accept-Language
		in: header
		required: true
		description: Language code intended for backmarket audience
		schema:
			type: string
			format: language-code
			default: 'en-us'
	...
```

## backmarket-ensure-param-examples

Every parameter *MUST* include an example to perform contract testing and help API users understand how to use it.

```yaml
...
parameters:
	- name: productId
		in: path
		schema:
			type: integer
		required: true
		example: 123
....
```

## backmarket-ensure-properties-example

Properties *SHOULD* include examples as much as possible.

```yaml
type: object
properties:
  amount:
    type: integer
    description: amount in gramme
    example: 32
```

## backmarket-ensure-every-endpoint-has-a-service-tier

Endpoints *MUST* include a service tier as this solve this main issues: 

1. *Incident management*: During an outage, we don’t know its importance level and this create a lot of noise and stress.
2. *Incident prioritisation*: We lack autonomy in resolving issues as we don’t know how to self-assess a service and its business criticality.

Defining this metadata will enable us as a company to have less mean time to recover for our incidents.

Accepted values are : 1, 2, 3 or 0 for unknown. For more info check this link [internal](https://backmarket.atlassian.net/wiki/spaces/SRE/pages/1753710658).

```yaml
...
paths:
  /branding/daily-ewaste:
    get:
      x-tier: 3
      operationId: getDailyEwaste
      summary: 'Returns the daily ewaste amount. This amount is compute each 3 hours'
...
```

## backmarket-ensure-endpoint-summary

Endpoints *SHOULD* have a summary.

## backmarket-ensure-schema-has-type

## backmarket-ensure-array-params-have-items-with-type

## backmarket-paths-kebab-case

All paths *SHOULD* be kebab case.

```yaml
paths:
  /landing-page/:
```