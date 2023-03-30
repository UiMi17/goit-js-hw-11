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
  imageType: 'photo',
  imageOrientation: 'horizontal',
  safeSearch: true,
  page: 1,
  perPage: 40,
  searchItem: '',
};

refs.loadMoreBtn.addEventListener('click', onLoadBtnClick);

const gallery = new SimpleLightbox('.photo-card a', {
  captions: true,
  captionsData: 'alt',
  captionDelay: 300,
});

const headroom = new Headroom(refs.header);
headroom.init();

async function fetchImages({
  imageType,
  imageOrientation,
  safeSearch,
  page,
  perPage,
  searchItem,
}) {
  const { data } = await axios.get(
    `${url}&image_type=${imageType}&orientation=${imageOrientation}&safesearch=${safeSearch}&page=${page}&per_page=${perPage}&q=${searchItem}`
  );

  if (data.totalHits === 0) {
    throw 'Sorry, there are no images matching your search query. Please try again.';
  }

  return data;
}

refs.form.addEventListener('submit', onSubmitClick);

async function onSubmitClick(ev) {
  ev.preventDefault();

  if (data.searchItem === refs.form.imgFinder.value) {
    return;
  }

  try {
    data.page = 1;

    data.searchItem = refs.form.imgFinder.value;

    const response = await fetchImages(data);

    if (response.totalHits <= data.page * data.perPage) {
      refs.loadMoreBtn.disabled = true;
    } else {
      refs.loadMoreBtn.disabled = false;
    }

    if (response.totalHits !== 0) {
      refs.gallery.innerHTML = '';
      createGalleryElements(response);
      Notiflix.Notify.success(`Hooray! We found ${response.totalHits} images.`);
    }
  } catch (error) {
    data.searchItem = '';
    refs.loadMoreBtn.disabled = true;
    Notiflix.Notify.failure(error);
  }
}

async function onLoadBtnClick() {
  try {
    data.page += 1;
    const response = await fetchImages(data);

    if (response.totalHits <= data.page * response.hits.length) {
      throw "We're sorry, but you've reached the end of search results.";
    }
    createGalleryElements(response);
  } catch (error) {
    refs.loadMoreBtn.disabled = true;
    Notiflix.Notify.failure(error);
  }
}

function createGalleryElements(responseData) {
  const imagesArr = responseData.hits;
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
}
