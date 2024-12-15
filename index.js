import puppeteer from "puppeteer";

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 뷰포트 크기를 크게 설정
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(
      "https://pages.coupang.com/p/121237?sourceType=oms_goldbox",
      { waitUntil: "networkidle0" }
    );

    console.log("페이지 스크롤 시작...");

    // 이전 상품 수를 저장할 변수
    let previousProductCount = 0;
    let sameCountTimes = 0;

    while (true) {
      // 현재 로드된 상품 수 확인
      const currentProducts = await page.evaluate(() => {
        const products = document.querySelectorAll(
          ".recommend-product-container .recommend-product"
        );
        return products.length;
      });

      console.log(`현재 로드된 상품 수: ${currentProducts}`);

      // 이전과 같은 수의 상품이 3번 연속으로 확인되면 종료
      if (currentProducts === previousProductCount) {
        sameCountTimes++;
        if (sameCountTimes >= 3) {
          console.log("더 이상 새로운 상품이 로드되지 않음");
          break;
        }
      } else {
        sameCountTimes = 0;
      }

      previousProductCount = currentProducts;

      // 페이지 끝까지 스크롤하고 로딩 대기
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.scrollTo(0, document.documentElement.scrollHeight);
          setTimeout(resolve, 1000);
        });
      });

      // 네트워크 요청이 완료될 때까지 대기
      await page.waitForNetworkIdle({ timeout: 3000 }).catch(() => {});
    }

    console.log("모든 상품 로드 완료, 데이터 수집 중...");

    // 상품 정보 수집
    const products = await page.evaluate(() => {
      const items = document.querySelectorAll(
        ".recommend-product-container .recommend-product"
      );
      return Array.from(items)
        .map((item) => {
          const link = item.querySelector("a");
          const name = item.querySelector(".recommend-product__name");
          const price = item.querySelector(".recommend-product__price .price");
          const originalPrice = item.querySelector(
            ".recommend-product__price .original-price"
          );

          return {
            url: link ? link.href : "",
            name: name ? name.textContent.trim() : "",
            price: price ? price.textContent.trim() : "",
            originalPrice: originalPrice
              ? originalPrice.textContent.trim()
              : "",
          };
        })
        .filter(
          (item) => item.url && item.url.includes("www.coupang.com/vp/products")
        );
    });

    // 중복 제거
    const uniqueProducts = Array.from(
      new Set(products.map((p) => JSON.stringify(p)))
    ).map((p) => JSON.parse(p));

    console.log("\n=== 크롤링 결과 ===");
    console.log("총 상품 수:", uniqueProducts.length);
    uniqueProducts.forEach((product, index) => {
      console.log(`\n[상품 ${index + 1}]`);
      console.log("상품명:", product.name);
      console.log("가격:", product.price);
      console.log("원래가격:", product.originalPrice);
      console.log("URL:", product.url);
    });

    await browser.close();
  } catch (error) {
    console.error("크롤링 중 에러 발생:", error);
  }
};

crawler();
