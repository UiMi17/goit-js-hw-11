import Notiflix from 'notiflix';
import _, { functionsIn } from 'lodash';
import axios from 'axios';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const token = '34819242-61fdcfe42d1461d5acd80d71b';
const url = `https://pixabay.com/api/?key=${token}`;

const refs = {
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

async function fetchImages({
  imageType,
  imageOrientation,
  safeSearch,
  page,
  perPage,
  searchItem,
}) {
  try {
    await axios
      .get(
        `${url}&image_type=${imageType}&orientation=${imageOrientation}&safesearch=${safeSearch}&page=${page}&per_page=${perPage}&q=${searchItem}`
      )
      .then(result => {
        if (result.data.totalHits < 3) {
          data.status = 404;
          throw new Error(
            'Sorry, there are no images matching your search query. Please try again.'
          );
        } else if (result.data.hits.length < perPage) {
          data.perPage = result.data.hits.length;
          data.status = 404;
          throw new Error(
            "We're sorry, but you've reached the end of search results."
          );
        } else if (result.data.totalHits <= page * result.data.hits.length) {
          data.status = 404;
          throw new Error(
            "We're sorry, but you've reached the end of search results."
          );
        }
        responseData = result;
      });
  } catch (error) {
    Notiflix.Notify.failure(error.message);
  }
}

refs.form.addEventListener('submit', onSubmitClick);

async function onSubmitClick(ev) {
  ev.preventDefault();

  if (data.currentSearch === 1) {
    data.searchItem = refs.form.imgFinder.value;

    await fetchImages(data);

    if (responseData.data.totalHits !== 0) {
      Notiflix.Notify.success(`Hooray! We found ${responseData.data.totalHits} images.`)
      responseData.data.totalHits = 0
    }

    if (data.status === 404) {
      refs.loadMoreBtn.disabled = true;
      data.status = '';
      return;
    }

    createGalleryElements(responseData);

    data.currentSearch += 1;
  } else if (data.searchItem !== refs.form.imgFinder.value) {
    data.page = 1;
    refs.gallery.innerHTML = '';

    data.searchItem = refs.form.imgFinder.value;

    await fetchImages(data);

    if (responseData.data.totalHits !== 0) {
      Notiflix.Notify.success(`Hooray! We found ${responseData.data.totalHits} images.`)
      responseData.data.totalHits = 0
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

  await fetchImages(data);

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

  const gallery = new SimpleLightbox('.photo-card a', {
    captions: true,
    captionsData: 'alt',
    captionDelay: 300,
  })
  gallery.refresh()

  refs.loadMoreBtn.disabled = false
}
