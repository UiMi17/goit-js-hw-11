import Notiflix from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Headroom from 'headroom.js';

const token = '34819242-61fdcfe42d1461d5acd80d71b';
const url = `https://pixabay.com/api/?key=${token}`;

const refs = {
  header: document.querySelector('header'),
  form: document.querySelector('.finder-box'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
  searchBtn: document.querySelector('.finder-box__search-btn'),
};

const data = {
  status: '',
  imageType: 'photo',
  imageOrientation: 'horizontal',
  safeSearch: true,
  page: 1,
  perPage: 40,
  currentSearch: 1,
  searchItem: '',
};

let responseData;

const gallery = new SimpleLightbox('.photo-card a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 300,
});

const headroom = new Headroom(refs.header);
headroom.init();

function fetchImages({
  imageType,
  imageOrientation,
  safeSearch,
  page,
  perPage,
  searchItem,
}) {
  return axios.get(
    `${url}&image_type=${imageType}&orientation=${imageOrientation}&safesearch=${safeSearch}&page=${page}&per_page=${perPage}&q=${searchItem}`
  );
}

refs.form.addEventListener('submit', onSubmitClick);

async function onSubmitClick(ev) {
  ev.preventDefault();

  if (data.currentSearch === 1) {
    data.searchItem = refs.form.imgFinder.value;

    await fetchImages(data)
      .then(response => {
        if (response.data.totalHits === 0) {
          throw new Error(
            'Sorry, there are no images matching your search query. Please try again.'
          );
        }
        responseData = response;
      })
      .catch(error => {
        data.status = 404;
        Notiflix.Notify.failure(error.message);
      });

    if (data.status === 404) {
      refs.loadMoreBtn.disabled = true;
      data.status = '';
      return;
    }

    if (responseData.data.totalHits !== 0) {
      Notiflix.Notify.success(
        `Hooray! We found ${responseData.data.totalHits} images.`
      );
      responseData.data.totalHits = 0;
    }

    createGalleryElements(responseData);

    data.currentSearch += 1;

  } else if (data.searchItem !== refs.form.imgFinder.value) {
    data.page = 1;
    refs.gallery.innerHTML = '';

    data.searchItem = refs.form.imgFinder.value;

    responseData = await fetchImages(data);

    if (responseData.data.totalHits !== 0) {
      Notiflix.Notify.success(
        `Hooray! We found ${responseData.data.totalHits} images.`
      );
      responseData.data.totalHits = 0;
    }

    if (data.status === 404) {
      refs.loadMoreBtn.disabled = true;
      data.status = '';
      return;
    }

    createGalleryElements(responseData);
  }

  refs.loadMoreBtn.addEventListener('click', onLoadBtnClick);
}

async function onLoadBtnClick() {
  data.page += 1;

  await fetchImages(data)
    .then(response => {
      if (response.data.totalHits <= data.page * response.data.hits.length) {
        throw new Error(
          "We're sorry, but you've reached the end of search results."
        );
      }
    })
    .catch(error => {
      data.status = 404;
      Notiflix.Notify.failure(error.message);
    });

  if (data.status === 404) {
    refs.loadMoreBtn.disabled = true;
    data.status = '';
    return;
  }

  createGalleryElements(responseData);
}

function createGalleryElements(responseData) {
  const imagesArr = responseData.data.hits;
  const elementsTemplate = imagesArr
    .map(image => {
      return `
    <div class="photo-card">
    <a class="slb" href="${image.largeImageURL}">
    <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy"/>
    </a>
    <div class="info">
      <p class="info-item">
      Likes: 
        <b>${image.likes}</b>
      </p>
      <p class="info-item">
      Views: 
        <b>${image.views}</b>
      </p>
      <p class="info-item">
      Comments: 
        <b>${image.comments}</b>
      </p>
      <p class="info-item">
      Downloads: 
        <b>${image.downloads}</b>
      </p>
    </div>
  </div>
  `;
    })
    .join('');

  refs.gallery.insertAdjacentHTML('beforeend', elementsTemplate);

  gallery.refresh();

  refs.loadMoreBtn.disabled = false;
}
