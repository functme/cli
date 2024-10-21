# Funct.me Command Line Tools

Welcome to the [**Funct.me**](https://funct.me) command line tools.
You can use these tools to publish new packages to the Funct registry,
available at [funct.me/packages](https://funct.me/packages).

## What is Funct?

Funct is an AI bot hosting service (beta) that allows you to build
ChatGPT-powered bots for Discord. These bots can be extended to perform
specific actions with custom functions aka "functs". Multiple functions
can be packaged together in a single service, referred to as a
[package](https://funct.me/packages).

If you're a developer, you can think of Funct as a
**registry and hosting service for AI actions**. The goal is for
our developer community to ship functs that anybody can use to
extend their own bots, sort of like NPM for AI bots.

## Quickstart

Visit [funct.me/signup](https://funct.me/signup) to register.
Build a new bot is easy, you can then use this CLI to develop
and publish custom packages to extend your bots.

```shell
$ npm i funct.me -g
$ mkdir new-project
$ cd new-project
$ funct init  # initialize funct project in this directory
$ funct login # log in to funct
$ funct serve # run your functs on a local serve to test
$ funct run / # test a single endpoint (like curl)
$ funct up    # publish to development environment
```

You can run `funct help` at any time to see available commands.

# Table of contents

1. [How does Funct work?](#how-does-funct-work)
   1. [Is this free or paid](#is-this-free-or-paid)
1. [Building custom packages for your bots](#building-custom-packages-for-your-bots)
   1. [Initialize a project](#initialize-a-project)
      1. [Defining actions aka endpoints aka functs](#defining-actions-aka-endpoints-aka-functs)
      1. [Endpoint name, description, types](#endpoint-name-description-types)
   1. [Deploy a Funct package](#deploy-a-funct-package)
      1. [Public packages](#public-packages)
      1. [Private packages](#private-packages)
1. [Additional tools](#additional-tools)
   1. [Generate endpoints](#generate-endpoints)
   1. [Generate tests](#generate-tests)
   1. [Run tests](#run-tests)
   1. [Environment variables](#environment-variables)
1. [Roadmap](#roadmap)
1. [Contact](#contact)

# How does Funct work?

[Funct.me](https://funct.me) is an AI bot hosting service that has
three major components.

- Discord bot hosting
- Agent hosting
- Function hosting

It works like this;

1. You connect Funct to your Discord server as a **discord link**
   - The bot can be unlinked and / or kicked at any time
   - Trigger your bot by `@mention` e.g. `@Funct hello there!`
2. You assign an **agent** to your Discord server
   - This can be programmed with a custom name, personality, and actions
   - Agents can be tested independently via the [funct.me](https://funct.me) dashboard
3. You develop and assign funct **packages** your agent can take action with
   - These can be developed and shared publicly or privately
4. Once you've assigned actions to your bot, it will intelligently
   decide how and when to use them based on what it is asked

## Is this free or paid?

While in beta all users get $1.00 in free usage credits to start with.
You are billed from your credit balance for AI model usage (generating responses)
and all function calls based on compute time (actions). If you run
out of credits and can't afford more but are excited to contribute, please
visit our Discord at [discord.gg/funct](https://discord.gg/funct) and
explain your circumstances, we'll do our best to help.

Funct is built and maintained by a single developer and my goal is to make
sure the initiative is sustainable. Credit purchases during the beta are
appreciated. As adoption and use cases grow, expect there to be iteration
on pricing and plans.

# Building custom packages for your bots

Building bots on [Funct.me](https://funct.me) is straightforward,
but right now custom actions can only be published via the command line.
Public packages can be used by anybody, check [funct.me/packages](https://funct.me/packages)
for existing packages before trying to build your own.

## Initialize a project

To initialize a new Funct project:

```shell
$ npm i funct.me -g
$ mkdir new-project
$ cd new-project
$ funct init
```

You'll be walked through the process. Funct will automatically check for updates
to core packages, so make sure you update when available. To play around with your
Funct locally;

```shell
$ funct serve
```

Will start an HTTP server. To execute a standalone function:

```shell
$ funct run /
```

### Defining actions aka endpoints aka functs

Defining custom functs is easy. You'll find the terms **action**,
**endpoint** and **funct** used interchangeably as they all refer
to the same thing: your bot executing custom code in the cloud.
However there are subtle differences;

- An **action** is code that's executed by your bot
- An **endpoint** refers to the specific hosted URL (e.g. `my-pkg.funct.sh/do-thing`)
  and action that's being triggered
- A **funct** is an endpoint specific to the Funct registry

So a **funct** is an **endpoint** hosted by the Funct registry that
performs an **action**.

All endpoints for Funct packages live in the `functions/` directory.
Each file name maps to the endpoint route e.g. `functions/hello.mjs`
routes to `localhost:8000/hello`. You can export custom `GET`, `POST`, `PUT`
and `DELETE` functions from every file. Here's an example "hello world" endpoint:

```javascript
// functions/hello.mjs (mjs is node module default)

/**
 * A basic hello world function
 * @param {string} name Your name
 * @returns {string} message The return message
 */
export async function GET (name = 'world') {
  return `hello ${name}`!
};
```

You can write any code you want and install any NPM packages you'd like to
your Funct.

### Endpoint name, description, types

Using the comment block above every exported method (e.g. GET) you can
define your endpoint. Funct uses an open source specification called
[Instant API](https://github.com/instant-dev/api) to export JavaScript
functions as type safe web APIs. You can learn more about how to properly
define and document the shape (parameters) of your API there.

## Deploy a Funct package

### Public packages

**NOTE:** You **will not** be charged for other people using your public actions.
They are billed directly from their account.

By default all packages are created as public projects. Public
projects are namespaced to your username, e.g. `@my-username/project`.
This can be found in the `"name"` field of `funct.json`.

Note that the code for public projects will be shared publicly for anybody
to see, and the expectation is that others can use this code in their bots
as well.
they will be billed from their balance.

To deploy a public project to a `development` environment, you can use:

```shell
$ funct up
```

You can also publish to `staging` and `production` using:

```shell
$ funct up --env staging
$ funct up --env production
```

### Private packages

**NOTE:** You **_WILL_** be charged by anybody accessing your private
packages. However, all code and endpoints will not be publicly available;
you must share the URL with somebody in order for them to use it.

You can publish private project by prepending `private/` on the
`"name"` field in `funct.json`, e.g.

```json
{
  "name": "private/@my-username/private-package"
}
```

You then deploy as normal. These packages will be visible by you in the
registry but nobody else.

# Additional tools

There are a few additional tools you may find useful with this package;

## Generate endpoints

```shell
# generates functions/my-endpoint/example.mjs
$ funct g:endpoint my-endpoint/example
```

## Generate tests

```shell
# Generate blank tests or ones for an endpoint
$ funct g:test my_test # OR ...
$ funct g:test --endpoint my-endpoint/example
```

## Run tests

You can write tests for your functs to verify they work. Simply run;

```shell
$ funct test
```

And voila!

## Environment variables

You can store environment variables with your functs in;

```
.env
.env.production
.env.staging
```

These files **will not** be published for everybody to see, so
you can use them to hide secrets within your code. However, be
careful when using environment variables with public packages:
if you ever return them in an endpoint response, or connect to
sensitive data, there's a chance you may expose that information
to another user of the platform.

# Roadmap

There's a lot to build! Funct is still in early beta. Coming soon;

- Conversation memory
  - Bots remember what you said and previous conversations
- Secure API secret sharing
  - Some of the most fun actions come from using third-party APIs
  - We'll be introducing a way to publish custom actions that
    users can enter in their own API credentials to use

Submit requests via Discord at [discord.gg/funct](https://discord.gg/funct)!

# Contact

The best place for help and support is Discord at [discord.gg/funct](https://discord.gg/funct),
but feel free to bookmark all of these links.

| Destination | Link |
| ----------- | ---- |
| Home | [funct.me](https://funct.me) |
| GitHub | [github.com/functme](https://github.com/functme) |
| Discord | [discord.gg/funct](https://discord.gg/funct) |
| X / funct.me | [x.com/functme](https://x.com/functme) |
| X / Keith Horwood | [x.com/keithwhor](https://x.com/keithwhor) |
