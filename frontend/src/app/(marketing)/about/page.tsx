"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-h4 font-display font-bold text-gray-900 dark:text-gray-50">
                IoTDB Enhanced
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-body text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                首页
              </Link>
              <a href="/pricing" className="text-body text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                定价
              </a>
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  登录
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-display text-gray-900 dark:text-gray-50 mb-6">
            关于我们
          </h1>
          <p className="text-body-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            我们致力于为工业物联网领域提供最强大的时序数据分析平台
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-h1 text-gray-900 dark:text-gray-50 mb-6">
                我们的使命
              </h2>
              <p className="text-body text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                IoTDB Enhanced 致力于让时序数据分析变得简单、强大、可访问。
                我们相信，每一个工业设备产生的数据都蕴含着巨大的价值，
                而我们的任务是帮助您发现并利用这些价值。
              </p>
              <p className="text-body text-gray-600 dark:text-gray-400 leading-relaxed">
                通过集成最先进的 AI 技术，我们不仅提供数据存储和查询能力，
                更提供预测、预警和智能分析功能，帮助企业在问题发生前就发现并解决它们。
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary mb-2">
                    2024
                  </div>
                  <div className="text-body-sm text-gray-500 dark:text-gray-400">
                    成立年份
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary mb-2">
                    500+
                  </div>
                  <div className="text-body-sm text-gray-500 dark:text-gray-400">
                    企业用户
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary mb-2">
                    50+
                  </div>
                  <div className="text-body-sm text-gray-500 dark:text-gray-400">
                    国家地区
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-primary mb-2">
                    1B+
                  </div>
                  <div className="text-body-sm text-gray-500 dark:text-gray-400">
                    数据点/天
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-h1 text-gray-900 dark:text-gray-50 mb-4">
              我们的核心价值观
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-primary-light dark:bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-h4 font-display font-bold text-gray-900 dark:text-gray-50 mb-3">
                安全第一
              </h3>
              <p className="text-body text-gray-600 dark:text-gray-400 leading-relaxed">
                数据安全是我们的首要任务。我们采用企业级加密、访问控制和审计机制，
                确保您的数据始终安全。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-success-light dark:bg-success/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-h4 font-display font-bold text-gray-900 dark:text-gray-50 mb-3">
                追求卓越
              </h3>
              <p className="text-body text-gray-600 dark:text-gray-400 leading-relaxed">
                我们不断优化性能、改进用户体验、引入最新技术，
                确保平台始终保持行业领先水平。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-info-light dark:bg-info/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-h4 font-display font-bold text-gray-900 dark:text-gray-50 mb-3">
                用户至上
              </h3>
              <p className="text-body text-gray-600 dark:text-gray-400 leading-relaxed">
                我们倾听用户的声音，快速响应需求，持续改进产品，
                确保每个用户都能获得最佳体验。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-h1 text-gray-900 dark:text-gray-50 mb-4">
              领导团队
            </h2>
            <p className="text-body-lg text-gray-600 dark:text-gray-400">
              来自世界顶级科技公司的资深专家
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "张明",
                role: "CEO & 联合创始人",
                bio: "前阿里云资深架构师，15年分布式系统经验",
              },
              {
                name: "李娜",
                role: "CTO & 联合创始人",
                bio: "前Google AI研究员，专注于时序数据和机器学习",
              },
              {
                name: "王强",
                role: "VP of Engineering",
                bio: "前微软首席工程师，负责核心平台架构",
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-hover rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-display font-bold text-white">
                    {member.name[0]}
                  </span>
                </div>
                <h3 className="text-h4 font-display font-bold text-gray-900 dark:text-gray-50 mb-1">
                  {member.name}
                </h3>
                <p className="text-body-sm text-primary font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-body text-gray-600 dark:text-gray-400">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-h1 text-gray-900 dark:text-gray-50 mb-6">
            加入我们的旅程
          </h2>
          <p className="text-body-lg text-gray-600 dark:text-gray-400 mb-10">
            我们正在寻找有才华的人才加入我们的团队
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="min-w-[160px]">
                查看职位
              </Button>
            </Link>
            <Button variant="ghost" size="lg" className="min-w-[160px]">
              联系我们
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-body-sm text-gray-500 dark:text-gray-400">
            © 2026 IoTDB Enhanced. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
