const axios = require('axios');
const utils = require('./utils');

const BASE_URL = 'https://swapi.co/api';

const getUrl = url => {
  return axios.get(url).catch(err => console.log(err));
};

const search = criteria => {
  return axios
    .get(`${BASE_URL}/people/?search=${criteria}`)
    .then(response => {
      return response.data;
    })
    .catch(err => err.response);
};

const getPage = page => {
  return axios
    .get(`${BASE_URL}/people/?page=${page}`)
    .then(response => {
      return response.data;
    })
    .catch(err => err.response);
};

const getPeople = (querystring = '') => {
  return axios
    .get(`${BASE_URL}/people${querystring}`)
    .then(response => {
      return response.data;
    })
    .catch(err => err.response);
};

const getFilms = (querystring = '/') => {
  return axios
    .get(`${BASE_URL}/films${querystring}`)
    .then(response => {
      return response.data;
    })
    .catch(err => err.response);
};

module.exports = {
  getPeople,
  getFilms,
  getUrl,
  search,
  getPage
};
