import puppeteer from "puppeteer";

const crawler = async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(
      "https://pages.coupang.com/p/121237?sourceType=oms_goldbox",
      { waitUntil: "networkidle0" }
    );

    console.log("페이지 스크롤 시작...");

    let scrollPosition = 0;
    const allProducts = new Set();

    while (true) {
      const newProducts = await page.evaluate(() => {
        // 1. 링크 추출 함수
        const crawlLink = (item) => {
          const linkElement = item.querySelector("a");
          return linkElement ? linkElement.href : "";
        };

        // 2. 이미지 추출 함수
        const crawlImage = (item) => {
          const imageDiv = item.querySelector(
            ".discount-product-unit__product_image"
          );
          return imageDiv ? imageDiv.querySelector("img").src : "";
        };

        // 3. 제목 추출 함수
        const crawlTitle = (item) => {
          const titleElement = item.querySelector(".info_section__title");
          return titleElement ? titleElement.textContent : "";
        };

        // 4. 할인율 추출 함수
        const crawlSalePoint = (item) => {
          const saleRateElement = item.querySelector(
            ".sale_point_badge__content"
          );
          return saleRateElement ? saleRateElement.textContent : "";
        };

        // 5. 할인가 추출 함수
        const crawlDiscountPrice = (item) => {
          const discountPriceElement = item.querySelector(
            ".price_info__discount"
          );
          return discountPriceElement ? discountPriceElement.textContent : "";
        };

        // 6. 기존가 추출 함수
        const crawlOriginalPrice = (item) => {
          const originalPriceElement = item.querySelector(".price_info__base");
          return originalPriceElement ? originalPriceElement.textContent : "";
        };

        // 7. 판매율 추출 함수
        const crawlSaleRate = (item) => {
          const saleRateElement = item.querySelector(
            ".sale-progress-bar__rate"
          );
          return saleRateElement ? saleRateElement.textContent : "";
        };

        const nodeItems = document.querySelectorAll(".grid-2 .weblog");
        const arrItems = Array.from(nodeItems);
        const arrObject = arrItems.map((item) => {
          return {
            title: crawlTitle(item),
            salePoint: crawlSalePoint(item),
            discountPrice: crawlDiscountPrice(item),
            originalPrice: crawlOriginalPrice(item),
            saleRate: crawlSaleRate(item),
            imageUrl: crawlImage(item),
            productUrl: crawlLink(item), // 상품 링크 추가
          };
        });

        return arrObject;
      });

      newProducts.forEach((product) => {
        if (product.title) {
          allProducts.add(JSON.stringify(product));
        }
      });

      console.log(`현재까지 수집된 상품 수: ${allProducts.size}`);

      const isScrollEnd = await page.evaluate((currentPosition) => {
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        return currentPosition + clientHeight >= scrollHeight;
      }, scrollPosition);

      if (isScrollEnd) {
        console.log("페이지 끝에 도달했습니다.");

        console.log("\n=== 수집된 모든 상품 정보 ===");
        console.log(`총 ${allProducts.size}개의 상품이 수집되었습니다.`);

        Array.from(allProducts).forEach((productString, index) => {
          const product = JSON.parse(productString);
          console.log(`\n[상품 ${index + 1}]`);
          console.log("제목:", product.title);
          console.log("할인율:", product.salePoint);
          console.log("할인가격:", product.discountPrice);
          console.log("원래가격:", product.originalPrice);
          console.log("판매율:", product.saleRate);
          console.log("상품 이미지 URL:", product.imageUrl);
          console.log("상품 링크:", product.productUrl); // 상품 링크 출력
        });

        break;
      }

      await page.evaluate((currentPosition) => {
        return new Promise((resolve) => {
          const scrollStep = 1000;
          window.scrollTo(0, currentPosition + scrollStep);
          setTimeout(resolve, 100);
        });
      }, scrollPosition);

      scrollPosition += 500;
    }

    await browser.close();
  } catch (error) {
    console.error("크롤링 중 에러 발생:", error);
  }
};

crawler();
