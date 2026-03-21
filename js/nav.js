// TOC 클릭 시 모바일 메뉴 닫기
document.querySelectorAll('.toc a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('toc').classList.remove('show');
  });
});