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
        const items = document.querySelectorAll(".grid-2 .weblog");
        return Array.from(items).map((item) => {
          // 링크 추출
          const linkElement = item.querySelector("a");
          const href = linkElement ? linkElement.href : "";

          // 이미지 URL 추출
          const imageDiv = item.querySelector(
            ".discount-product-unit__product_image"
          );
          const imageStyle = imageDiv ? imageDiv.style.backgroundImage : "";
          const backgroundImageUrl = imageStyle
            ? imageStyle.match(/url\(['"]?(.*?)['"]?\)/)?.[1]
            : "";

          const imgTag = imageDiv ? imageDiv.querySelector("img") : null;
          const imgSrc = imgTag ? imgTag.src : "";
          const imgDataSrc = imgTag ? imgTag.getAttribute("data-src") : "";

          return {
            title:
              item.querySelector(".info_section__title")?.textContent?.trim() ||
              "",
            salePoint:
              item
                .querySelector(".sale_point_badge__content")
                ?.textContent?.trim() || "",
            discountPrice:
              item
                .querySelector(".price_info__discount")
                ?.textContent?.trim() || "",
            originalPrice:
              item.querySelector(".price_info__base")?.textContent?.trim() ||
              "",
            saleRate:
              item
                .querySelector(".sale-progress-bar__rate")
                ?.textContent?.trim() || "",
            backgroundImageUrl: backgroundImageUrl || "",
            imageUrl: imgSrc || imgDataSrc || "",
            productUrl: href || "", // 상품 링크 추가
          };
        });
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
          console.log("배경 이미지 URL:", product.backgroundImageUrl);
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
