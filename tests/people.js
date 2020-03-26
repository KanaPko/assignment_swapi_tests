const expect = require('chai').expect;

const api = require('../api');
const { validateProperties } = require('../utils');
const { SPEC, COMMON } = require('../constants');

describe('Test people endpoint', () => {
  let peopleSchema;
  let peopleResult;
  let peopleCharacters;
  let schemaCharacter;

  before(async () => {
    peopleSchema = await api.getPeople('/schema');
    peopleResult = await api.getPeople('/');

    peopleCharacters = peopleResult.results;
    schemaCharacter = peopleSchema.required;
  });

  describe('Validate response structure', () => {
    it('it should have schema for people resource', () => {
      expect(peopleSchema)
        .to.be.an('object')
        .and.haveOwnProperty('required');
    });

    it('it returns an object in response', () => {
      expect(peopleResult).to.be.an('object');
    });

    it('it has all necessary properties', () => {
      expect(peopleResult).to.have.keys('count', 'next', 'previous', 'results');
    });

    it('it has array of Characters if no filters are defined', () => {
      expect(peopleResult.count).to.equal(SPEC.PEOPLE_COUNT);
      expect(peopleCharacters).to.be.an('array');
    });

    it('its "count" property value equals to the real count of existing people objects', async () => {
      let realCount = peopleCharacters.length;
      let nextPage = peopleResult.next;

      while (nextPage) {
        const nextPageOfPeople = await api.getUrl(nextPage);
        const { next, results: nextPeopleCharacters } = nextPageOfPeople.data;

        realCount += nextPeopleCharacters.length;
        nextPage = next;
      }

      expect(realCount).to.be.equal(peopleResult.count);
    });

    it('each Character is an object', () => {
      peopleCharacters.forEach(character => {
        expect(character).to.be.an('object');
      });
    });

    it('its structure follows the schema', () => {
      peopleCharacters.map(character => {
        const isValidCharacter = validateProperties(schemaCharacter, character);

        expect(isValidCharacter).to.be.true;
      });
    });
  });

  describe('Check Character entity', () => {
    it('it has array of film URLs', () => {
      peopleCharacters.forEach(({ films }) => {
        expect(films).to.be.an('array');
      });
    });

    it('it has at least one film URL', () => {
      const isCharacterOfFilm = peopleCharacters.every(
        ({ films }) => films.length > 0
      );

      expect(isCharacterOfFilm).to.be.true;
    });

    it('it retrieves a film object by URL from the "films" array', () => {
      peopleCharacters
        .slice(0, COMMON.REQUEST_THRESHOLD) // threshold is used to limit number of similar requests to the API
        .forEach(({ films }) => {
          films.slice(0, COMMON.REQUEST_THRESHOLD).forEach(async filmUrl => {
            const filmResponse = await api.getUrl(filmUrl);
            const { title } = filmResponse.data;

            expect(filmResponse.status).to.be.equal(200);
            expect(filmResponse.statusText).to.be.equal('OK');
            expect(title).to.not.be.empty;
          });
        });
    });

    it('there is the Character in all the films which are listed in its "films" list', () => {
      peopleCharacters
        .slice(0, COMMON.REQUEST_THRESHOLD) // threshold is used to limit number of similar requests to the API
        .forEach(({ films, name }) => {
          films.slice(0, COMMON.REQUEST_THRESHOLD).forEach(async filmUrl => {
            const filmResponse = await api.getUrl(filmUrl);
            const { characters } = filmResponse.data;

            let isFilmCharacter = false;
            for (const characterUrl of characters) {
              const characterResponse = await api.getUrl(characterUrl);
              const { name: expectedName } = characterResponse.data;

              if (expectedName === name) {
                isFilmCharacter = true;
                break;
              }
            }

            expect(isFilmCharacter).to.be.true;
          });
        });
    });
  });

  describe('Check people filtration', () => {
    describe('by ID', () => {
      it('it retrieves a character by its ID', async () => {
        const filteredPeople = await api.getPeople(
          `/${SPEC.FIRST_CHARACTER_ID}`
        );

        expect(filteredPeople)
          .to.be.an('object')
          .that.includes({ name: 'Luke Skywalker' });
      });

      it('it retrieves no character by out-of-range ID', async () => {
        const filteredPeople = await api.getPeople(
          `/${SPEC.FIRST_CHARACTER_ID - 1}`
        );

        expect(filteredPeople.status).to.be.equal(404);
      });
    });

    describe('by search criteria', () => {
      it('it should retrieve one Character by its exactly matching name', async () => {
        const SEARCH_CRITERIA = 'C-3PO';
        const searchResult = await api.search(SEARCH_CRITERIA);
        const { count, results } = searchResult;

        expect(count).to.be.equal(1);
        expect(results)
          .to.be.an('array')
          .that.have.length(1);
        expect(results[0]).to.include({ name: 'C-3PO' });
      });

      it('it should retrieve two Characters by partially matching names', async () => {
        const SEARCH_CRITERIA = 'Lu';
        const searchResult = await api.search(SEARCH_CRITERIA);
        const { count, results } = searchResult;

        expect(count).to.be.equal(2);
        expect(results)
          .to.be.an('array')
          .that.have.length(2);
        expect(results[0]).to.include({ name: 'Luke Skywalker' });
        expect(results[1]).to.include({ name: 'Luminara Unduli' });
      });

      it('it should not retrieve any Characters if no match is found', async () => {
        const SEARCH_CRITERIA = 'qwerty';
        const searchResult = await api.search(SEARCH_CRITERIA);
        const { count, results } = searchResult;

        expect(count).to.be.equal(0);
        expect(results)
          .to.be.an('array')
          .that.have.length(0);
      });

      it('it should retrieve all Characters if searching criteria is empty', async () => {
        const SEARCH_CRITERIA = '';
        const searchResult = await api.search(SEARCH_CRITERIA);
        const { count, next, results } = searchResult;

        expect(count).to.be.equal(SPEC.PEOPLE_COUNT);
        expect(results)
          .to.be.an('array')
          .that.have.length(10);
        expect(next).to.be.equal('https://swapi.co/api/people/?search=&page=2');
      });
    });
  });

  describe('Check pagination', () => {
    it('it gets the first page if no page id is in the URL', () => {
      const { next, results } = peopleResult;

      expect(next).to.be.equal('https://swapi.co/api/people/?page=2');
      expect(results)
        .to.be.an('array')
        .that.have.length(10);
    });

    it('it gets a certain page if its page ID is provided in the URL', async () => {
      const PAGE = '5';
      const { next, results } = await api.getPage(PAGE);

      expect(next).to.be.equal('https://swapi.co/api/people/?page=6');
      expect(results)
        .to.be.an('array')
        .that.have.length(10);
    });

    it('it redirects to the previous page URL from the last page', async () => {
      const { data: lastPageResult } = await api.getUrl(SPEC.LAST_PAGE_URL);
      const { previous } = lastPageResult;

      expect(previous).to.not.be.empty;

      const { data: previousPageResult } = await api.getUrl(previous);
      const { next } = previousPageResult;

      expect(next).to.be.equal(SPEC.LAST_PAGE_URL);
    });
  });
});
