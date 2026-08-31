$(()=>{
  const graduateCampaign = $('.js-slider--graduateCampaign');
  if (4 < graduateCampaign.find('.js-slider--graduateCampaign__slide').length){
    const graduateCampaignSliderOption = {
      slidesPerView: 3,
      spaceBetween: 20,
      loop: true,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      speed: 400,
      autoplay: {
        delay: 5000,
        disableOnInteraction: !1
      },
    }
    const graduateCampaignSlider = new Swiper('.js-slider--graduateCampaign', graduateCampaignSliderOption);
    graduateCampaign.css('--progressDuration', `${graduateCampaignSliderOption.autoplay.delay / 1000}s`);
    $('.js-slider--graduateCampaign__control').on('click', function(){
      if ($(this).parent().hasClass('is-stop')){
        $(this).parent().removeClass('is-stop');
        graduateCampaignSlider.autoplay.resume();
      }else{
        $(this).parent().addClass('is-stop');
        graduateCampaignSlider.autoplay.pause();
      }
    });
  }
  const campaignSlider = $('.js-slider--campaign');
  if (0 < campaignSlider.length){
    const campaignSlider = new Swiper('.js-slider--campaign', {
      slidesPerView: 1,
      spaceBetween: 20,
      loopedSlides: 1,
      centeredSlides: !0,
      wrapperClass: 'js-slider--campaign__wrapper',
      slideClass: 'js-slider--campaign__slide',
      speed: 400,
      autoplay: {
        delay: 4e3,
        disableOnInteraction: !1
      },
    });
  }
});
