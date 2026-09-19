package com.swp391.selfstorage.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Self-Storage Facility Rental and Management System API")
                        .version("1.0.0")
                        .description("Tài liệu API chính thức cho 5 actor và 7 luồng nghiệp vụ.")
                        .contact(new Contact().name("SWP391 Team"))
                        .license(new License().name("Apache 2.0")));
    }
}
